// src/api/client.js

let csrfToken = null;

const API_BASE = '/api/server';
const pendingRequests = new Map();
const requestQueue = [];
const MAX_CONCURRENT = 3;

let activeRequests = 0;
let processingQueue = false;

function handleRestrictionResponse(errorData) {
pendingRequests.clear();
requestQueue.length = 0;

try {
localStorage.setItem(
'login_message',
errorData?.error || 'Account restricted'
);
localStorage.removeItem('user');
} catch {}

try {
sessionStorage.clear();
} catch {}

csrfToken = null;

if (typeof window !== 'undefined') {
window.location.replace('/login');
}

throw new Error('Account restricted');
}

async function processQueue() {
if (processingQueue) return;

processingQueue = true;

try {
while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
const item = requestQueue.shift();

if (!item) break;  

  const { key, execute, resolve, reject } = item;  

  activeRequests += 1;  

  Promise.resolve()  
    .then(execute)  
    .then(resolve)  
    .catch(reject)  
    .finally(() => {  
      activeRequests -= 1;  
      pendingRequests.delete(key);  
      processQueue();  
    });  
}

} finally {
processingQueue = false;
}
}

function stableSerialize(value) {
if (value === undefined) return 'undefined';
if (value === null) return 'null';

if (typeof FormData !== 'undefined' && value instanceof FormData) {
return 'formdata';
}

if (Array.isArray(value)) {
return `[${value.map(stableSerialize).join(',')}]`;
}

if (typeof value === 'object') {
return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
}

return JSON.stringify(value);
}

function canonicalKey(method, moduleName, path, body, isFormData) {
const normalizedMethod = String(method || 'GET').toUpperCase();

const bodyKey =
isFormData
? 'formdata'
: normalizedMethod === 'GET' || normalizedMethod === 'HEAD'
? 'empty'
: stableSerialize(body || {});

return `${normalizedMethod}:${moduleName}:${path}:${bodyKey}`;
}

function dedupeAndQueue(key, execute) {
if (pendingRequests.has(key)) {
return pendingRequests.get(key);
}

const promise = new Promise((resolve, reject) => {
requestQueue.push({
key,
execute,
resolve,
reject
});

processQueue();

});

pendingRequests.set(key, promise);

return promise;
}

async function parseResponse(res) {
const text = await res.text();

if (!text) return {};

try {
return JSON.parse(text);
} catch {
return {
error: 'Unexpected server response. Please try again.'
};
}
}

function getErrorMessage(json, status) {
if (json?.error) return json.error;
if (json?.message) return json.message;

if (status === 400) return 'Invalid request.';
if (status === 401) return 'Authentication required.';
if (status === 403) return 'Access denied.';
if (status === 404) return 'Resource not found.';
if (status === 409) return 'Request conflicts with the current state.';
if (status === 429) return 'Too many requests. Please try again shortly.';
if (status >= 500) return 'Server error. Please try again later.';

return 'Request failed.';
}

function extractData(json) {
return json?.data !== undefined ? json.data : json;
}

async function executeRequest(url, options) {
const res = await fetch(url, options);
const json = await parseResponse(res);

if (json?.csrf_token) {
csrfToken = json.csrf_token;
}

if (!res.ok) {
if (res.status === 403 && json?.restricted) {
handleRestrictionResponse(json);
}

const error = new Error(getErrorMessage(json, res.status));  
error.status = res.status;  
error.data = json;  
throw error;

}

return extractData(json);
}

export async function apiCall(
moduleName,
path,
body = {},
method = 'POST',
isFormData = false
) {
const normalizedMethod = String(method || 'POST').toUpperCase();

const url =
`${API_BASE}?module=${encodeURIComponent(moduleName)}` +
`&path=${encodeURIComponent(path)}`;

const cacheKey = canonicalKey(
normalizedMethod,
moduleName,
path,
body,
isFormData
);

return dedupeAndQueue(cacheKey, async () => {
const headers = {};

if (csrfToken) {  
  headers['X-CSRF-Token'] = csrfToken;  
}  

let fetchBody;  

if (isFormData) {  
  fetchBody = body;  
} else if (  
  normalizedMethod !== 'GET' &&  
  normalizedMethod !== 'HEAD'  
) {  
  headers['Content-Type'] = 'application/json';  
  fetchBody = JSON.stringify(body ?? {});  
}  

return executeRequest(url, {  
  method: normalizedMethod,  
  headers,  
  credentials: 'include',  
  body: fetchBody  
});

});
}

export async function deleteRequest(
moduleName,
path,
params = {}
) {
return apiCall(moduleName, path, params, 'DELETE');
}

export async function getRequest(
moduleName,
path,
params = {}
) {
const queryParams = new URLSearchParams();

if (params && typeof params === 'object') {
Object.entries(params).forEach(([key, value]) => {
if (value === undefined || value === null) return;

if (Array.isArray(value)) {  
    value.forEach((item) => {  
      if (item !== undefined && item !== null) {  
        queryParams.append(key, String(item));  
      }  
    });  
    return;  
  }  

  queryParams.append(key, String(value));  
});

}

const query = queryParams.toString();

const url =
`${API_BASE}?module=${encodeURIComponent(moduleName)}` +
`&path=${encodeURIComponent(path)}` +
`${query ? `&${query}` : ''}`;

const cacheKey = `GET:${moduleName}:${path}:${query}`;

return dedupeAndQueue(cacheKey, async () => {
return executeRequest(url, {
method: 'GET',
credentials: 'include'
});
});
}

export async function signin(
email,
password,
turnstile_token,
mfa_code
) {
return apiCall('auth', 'signin', {
email,
password,
turnstile_token,
mfa_code
});
}

export async function signout() {
return apiCall('auth', 'signout', {});
}

export async function signup(
email,
password,
turnstile_token,
extra = {}
) {
return apiCall('auth', 'signup', {
email,
password,
turnstile_token,
...extra
});
}

export async function getUser() {
const url = `${API_BASE}?module=auth&path=get_user`;

return dedupeAndQueue('GET:auth:get_user:fresh', async () =>
  executeRequest(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  })
);
}

export async function updateProfile(full_name) {
return apiCall('auth', 'update_profile', {
full_name
});
}

export async function changePassword(
current_password,
new_password
) {
return apiCall('auth', 'change_password', {
current_password,
new_password
});
}

export async function requestHandoff() {
return apiCall('auth', 'handoff_create', {});
}

export async function exchangeHandoff(token) {
return apiCall('auth', 'handoff_exchange', {
token
});
}

export async function bootstrapPlatform(level) {
return getRequest('platform', 'bootstrap', {
level
});
}

export async function getPlatformConfig(level) {
return getRequest('platform', 'config', {
level
});
}

export async function getHeader(level) {
return getRequest('platform', 'header', {
level
});
}

export async function getFooter(level) {
return getRequest('platform', 'footer', {
level
});
}

export async function getLandingPage(level) {
return getRequest('platform', 'landing', {
level
});
}

export async function getOnboardingConfig(level) {
return getRequest('platform', 'onboarding_config', {
level
});
}

export async function getUIComponents(level) {
return getRequest('platform', 'ui_components', {
level
});
}

export async function getPlatformSections(levelId) {
return getRequest('platform', 'sections', {
level_id: levelId
});
}

export async function getAllSiteSections() {
  const { getCached, setCache } = await import('../utils/cache');
  const cacheKey = 'site_sections';
  const cached = getCached(cacheKey);

  if (cached) {
    getRequest('site-sections', 'get_all_site_sections')
      .then((data) => setCache(cacheKey, data))
      .catch(() => {});
    return cached;
  }

  const data = await getRequest('site-sections', 'get_all_site_sections');
  setCache(cacheKey, data);
  return data;
}

export async function getSectionHeadings() {
return getRequest(
'site-sections',
'get_section_headings'
);
}

export async function updateSiteSection(section, data) {
return apiCall(
'site-sections',
'update_site_section',
{
section,
data
}
);
}

export async function updateSectionHeadings(headings) {
return apiCall(
'site-sections',
'update_section_headings',
{
headings
}
);
}

export async function getInfoSection(section) {
  const { getCached, setCache } = await import('../utils/cache');
  const cacheKey = section === 'about' ? 'about_page' : `legal_${section}`;
  const cached = getCached(cacheKey);

  if (cached) {
    // Cache-first: public informational pages render immediately. Refresh in the background.
    getRequest('site-sections', 'get_info_section', { section })
      .then((data) => setCache(cacheKey, data))
      .catch(() => {});
    return cached;
  }

  const data = await getRequest('site-sections', 'get_info_section', { section });
  setCache(cacheKey, data);
  return data;
}

export async function getInfoSectionsList() {
return getRequest(
'site-sections',
'get_info_sections_list'
);
}

export async function updateInfoSection(section, data) {
return apiCall(
'site-sections',
'update_info_section',
{
section,
...data
}
);
}

export async function getNotesList(unitId = null) {
return getRequest(
'notes',
'list',
unitId ? { unit_id: unitId } : {}
);
}

export async function getNoteDetail(id) {
return getRequest('notes', 'detail', {
id
});
}

export async function getNoteBySlug(slug) {
return getRequest('notes', 'detail', {
slug
});
}

export async function getRelatedNotes(noteId) {
return getRequest('notes', 'related', {
note_id: noteId
});
}

export async function getNoteToc(noteId) {
return getRequest('notes', 'toc', {
note_id: noteId
});
}

export async function getReadingProgress(noteId) {
return getRequest('notes', 'reading_progress', {
note_id: noteId
});
}

export async function saveReadingProgress(
noteId,
scrollPercentage,
scrollPosition,
timeSpent,
completed
) {
return apiCall('notes', 'save_progress', {
note_id: noteId,
scroll_percentage: scrollPercentage,
scroll_position: scrollPosition,
time_spent: timeSpent,
completed
});
}

export async function getContinueReading(limit = 10) {
return getRequest('notes', 'continue_reading', {
limit
});
}

export async function getNoteDownloadUrl(id) {
return getRequest('notes', 'download_url', {
id
});
}

export async function getNotePreview(noteId) {
const data = await getRequest(
'notes',
'detail',
{
id: noteId
}
);

return {
content_preview: data?.content_preview,
read_time: data?.read_time,
title: data?.title
};
}

export async function getNoteContent(noteId) {
return getRequest('notes', 'detail', {
id: noteId
});
}

export async function getNoteInternalLinks(noteId) {
return getRequest(
'notes',
'internal_links',
{
note_id: noteId
}
);
}

export async function listArticles(params = {}) {
return getRequest('articles', 'list', params);
}

export async function getArticleBySlug(slug) {
return getRequest('articles', 'detail', { slug });
}

export async function getContentDetail(type, id) {
return getRequest('content', 'detail', {
type,
id
});
}

export async function getInternalLinks(type, id) {
return getRequest('content', 'links', {
type,
id
});
}

export async function getRelatedContent(type, id) {
return getRequest('content', 'related', {
type,
id
});
}

export async function toggleBookmark(type, id) {
return apiCall(
'content',
'toggle_bookmark',
{
content_type: type,
content_id: id
}
);
}

export async function rateContent(
type,
id,
rating,
difficultyRating
) {
return apiCall('content', 'rate', {
content_type: type,
content_id: id,
rating,
difficulty_rating: difficultyRating
});
}

export async function recordContentView(type, id) {
return apiCall('content', 'view', {
content_type: type,
content_id: id
});
}

export async function listCollections() {
return getRequest('content', 'collections');
}

export async function getCollection(slug) {
return getRequest('content', 'collection', {
slug
});
}

export async function getReactions(type, id) {
return getRequest(
'interactions',
'reactions',
{
content_type: type,
content_id: id
}
);
}

export async function getComments(type, id) {
return getRequest(
'interactions',
'comments',
{
content_type: type,
content_id: id
}
);
}

export async function getEngagementSummary(type, id) {
return getRequest(
'interactions',
'summary',
{
content_type: type,
content_id: id
}
);
}

export async function toggleReaction(
type,
id,
reaction
) {
return apiCall(
'interactions',
'toggle_reaction',
{
content_type: type,
content_id: id,
reaction_type: reaction
}
);
}

export async function addComment(
type,
id,
body,
parentId
) {
return apiCall(
'interactions',
'add_comment',
{
content_type: type,
content_id: id,
body,
parent_comment_id: parentId
}
);
}

export async function editComment(commentId, body) {
return apiCall(
'interactions',
'edit_comment',
{
id: commentId,
body
}
);
}

export async function deleteComment(commentId) {
return apiCall(
'interactions',
'delete_comment',
{
id: commentId
}
);
}

export async function getMyBookmarks() {
return getRequest(
'interactions',
'my_bookmarks'
);
}

export async function getPublicStats() {
return getRequest(
'interactions',
'get_public_stats'
);
}

export async function getPlatformStats() {
return getRequest(
'interactions',
'platform-stats'
);
}

export async function getUserDashboard() {
return getRequest(
'interactions',
'dashboard'
);
}

export async function getDailyChallenge() {
return getRequest(
'interactions',
'daily-challenge'
);
}

export async function getWeakAreas() {
return getRequest(
'interactions',
'weak-areas'
);
}

export async function getLearningPaths(level) {
return getRequest(
'interactions',
'learning-paths',
{
level
}
);
}

export async function getPersonalRecords() {
return getRequest(
'interactions',
'personal-records'
);
}

export async function getUserAchievements() {
return getRequest(
'interactions',
'get_user_achievements'
);
}

export async function getUserStreak() {
return getRequest(
'interactions',
'get_user_streak'
);
}

export async function getLeaderboard(
level,
limit = 20
) {
return getRequest(
'interactions',
'leaderboard',
{
level,
limit
}
);
}

export async function getRecallSession(unitId) {
return getRequest(
'recall',
'session',
{
unit_id: unitId
}
);
}

export async function checkRecallSession(unitId) {
return getRequest(
'recall',
'session_check',
{
unit_id: unitId
}
);
}

export async function continueRecallSession(sessionId) {
return apiCall(
'recall',
'continue',
{
session_id: sessionId
}
);
}

export async function submitRecallAnswer(
sessionId,
questionId,
answer
) {
return apiCall(
'recall',
'answer',
{
session_id: sessionId,
question_id: questionId,
user_answer: answer
}
);
}

export async function completeRecallSession(sessionId) {
return apiCall(
'recall',
'complete',
{
session_id: sessionId
}
);
}

export async function getRecallStats() {
return getRequest('recall', 'stats');
}

export async function getRecallAchievements() {
return getRequest('recall', 'achievements');
}

export async function getRecallDashboard() {
return getRequest('recall', 'dashboard');
}

export async function getRecallTopics(groupId) {
return getRequest(
'recall',
'topics',
{
group_id: groupId
}
);
}

export async function getSelectedLevel() {
return getRequest(
'recall',
'selected_level'
);
}

export async function setSelectedLevel(level) {
return apiCall(
'recall',
'set_selected_level',
{
level
}
);
}

export async function getNotifications(params = {}) {
return getRequest(
'recall',
'notifications',
params
);
}

export async function markNotificationRead(id) {
return apiCall(
'recall',
'notification_read',
{
notification_id: id
}
);
}

export async function markAllNotificationsRead() {
return apiCall(
'recall',
'notification_read_all',
{}
);
}

export async function dismissNotification(id) {
return apiCall(
'recall',
'notification_dismiss',
{
notification_id: id
}
);
}

export async function getNotificationPreferences() {
return getRequest(
'profile',
'notification_preferences'
);
}

export async function updateNotificationPreference(
module,
fields
) {
return apiCall('profile', 'update_notification_preferences', {
module,
...fields
});
}

export async function getProfileNotificationPreferences() {
  return getNotificationPreferences();
}

export async function updateProfileNotificationPreference(module, fields) {
  return updateNotificationPreference(module, fields);
}

export async function getClassroomLevels() {
return getRequest(
'classroom',
'levels'
);
}

export async function getClassroomTopics(
groupId,
level
) {
return getRequest(
'classroom',
'topics',
{
group_id: groupId,
level
}
);
}

export async function listClassrooms(
unitId,
groupId
) {
return getRequest(
'classroom',
'list',
{
unit_id: unitId,
group_id: groupId
}
);
}

export async function getLiveClassroomFeed() {
return getRequest(
'classroom',
'live_feed'
);
}

export async function getClassroomRoom(roomId) {
return getRequest(
'classroom',
'room',
{
room_id: roomId
}
);
}

export async function getClassroomMessages(roomId) {
return getRequest(
'classroom',
'messages',
{
room_id: roomId
}
);
}

export async function getClassroomParticipants(roomId) {
return getRequest(
'classroom',
'participants',
{
room_id: roomId
}
);
}

export async function joinClassroom(roomId) {
return apiCall(
'classroom',
'join',
{
room_id: roomId
}
);
}

export async function leaveClassroom(roomId) {
return apiCall(
'classroom',
'leave',
{
room_id: roomId
}
);
}

export async function sendClassroomMessage(
roomId,
message
) {
return apiCall(
'classroom',
'send_message',
{
room_id: roomId,
message
}
);
}

export async function raiseHand(
roomId,
raise
) {
return apiCall(
'classroom',
'raise_hand',
{
room_id: roomId,
raise
}
);
}

export async function applyAsTutor(
level,
className,
subjects,
qualifications,
experience
) {
return apiCall(
'classroom',
'tutor_apply',
{
level,
class_name: className,
subjects,
qualifications,
experience
}
);
}

export async function toggleClassroomMute(
roomId,
targetUserId,
mute
) {
return apiCall(
'classroom',
'toggle_mute',
{
room_id: roomId,
target_user_id: targetUserId,
mute
}
);
}

export async function endClassroom(roomId) {
return apiCall(
'classroom',
'end_room',
{
room_id: roomId
}
);
}

export async function shareClassroomResource(
roomId,
fileId
) {
return apiCall(
'classroom',
'share_resource',
{
room_id: roomId,
file_id: fileId
}
);
}

export async function fileClassroomComplaint(
roomId,
complaintType,
description
) {
return apiCall(
'classroom',
'file_complaint',
{
room_id: roomId,
complaint_type: complaintType,
description
}
);
}

export async function reviewTutorApplication(
applicationId,
action,
extra = {}
) {
return apiCall(
'classroom',
'tutor_review',
{
application_id: applicationId,
action,
...extra
}
);
}

export async function getTutorStatus() {
return getRequest(
'classroom',
'tutor_status'
);
}

export async function getTutorRooms() {
return getRequest(
'classroom',
'tutor_rooms'
);
}

export async function createClassroom(payload) {
return apiCall(
'classroom',
'create',
payload
);
}

export async function adminListRooms(filters = {}) {
return getRequest(
'classroom',
'admin_list_rooms',
filters
);
}

export async function adminListApplications(status) {
return getRequest(
'classroom',
'admin_list_applications',
status ? { status } : {}
);
}

export async function adminListComplaints(status) {
return getRequest(
'classroom',
'admin_list_complaints',
status ? { status } : {}
);
}

export async function adminResolveComplaint(
complaintId,
status,
resolution
) {
return apiCall(
'classroom',
'admin_resolve_complaint',
{
complaint_id: complaintId,
status,
resolution
}
);
}

export async function globalSearch(
q,
extraParams = {}
) {
const params = {
q,
...extraParams
};

return getRequest(
'search',
'global',
params
);
}

export async function searchNotes(
query,
limit = 20
) {
return getRequest(
'notes',
'search',
{
q: query,
limit
}
);
}

export async function getProfile() {
return getRequest(
'profile',
'get_profile'
);
}

export async function saveOnboarding(payload) {
return apiCall(
'profile',
'save_onboarding',
payload
);
}

export async function updateClass(class_name) {
return apiCall(
'profile',
'update_class',
{
class_name
}
);
}

export async function switchClass(group_id) {
return apiCall(
'profile',
'switch_class',
{
group_id
}
);
}

export async function requestLevelChange(
track,
className,
reason
) {
return apiCall(
'profile',
'request_level_change',
{
requested_track: track,
requested_class: className,
reason
}
);
}

export async function getClassSequence(track) {
return getRequest(
'profile',
'class_sequence',
{
track
}
);
}

export async function getPharmacyPrograms() {
return getRequest(
'profile',
'pharmacy_programs'
);
}

export async function getLevelChangeStatus() {
return getRequest(
'profile',
'level_change_status'
);
}

export async function getPendingLevelChanges() {
return getRequest(
'profile',
'pending_level_changes'
);
}

export async function reviewLevelChange(
request_id,
action
) {
return apiCall(
'profile',
'review_level_change',
{
request_id,
action
}
);
}

export async function adminUpdateProfile(
user_id,
track,
class_name
) {
return apiCall(
'profile',
'admin_update_profile',
{
user_id,
track,
class_name
}
);
}

export async function getDevices() {
return getRequest(
'profile',
'devices'
);
}

export async function revokeDevice(session_id) {
return apiCall(
'profile',
'revoke_device',
{
session_id
}
);
}

export async function getProfileNotificationPreferences() {
return getRequest(
'profile',
'notification_preferences'
);
}

export async function updateProfileNotificationPreference(module, settings = {}) {
return apiCall(
'profile',
'update_notification_preferences',
{
module,
...settings
}
);
}

export async function getNotificationSettings() {
return getProfileNotificationPreferences();
}

export async function saveNotificationSettings(preferences = {}) {
const entries = Object.entries(preferences);

const results = await Promise.all(
entries.map(([module, settings]) =>
updateProfileNotificationPreference(module, settings || {})
)
);

return {
success: true,
preferences: results
};
}

export async function getSettingsBundle() {
return getRequest(
'profile',
'settings_bundle'
);
}

export async function getReferralStats() {
return getRequest(
'profile',
'referral_stats'
);
}

export async function getCertificates() {
return getRequest(
'profile',
'certificates'
);
}

export async function getBillingSummary() {
return getRequest(
'profile',
'billing_summary'
);
}

export async function getApiKeys() {
return getRequest(
'profile',
'api_keys'
);
}

export async function getWebhooks() {
return getRequest(
'profile',
'webhooks'
);
}

export async function updateBio(bio) {
return apiCall('profile', 'update_bio', {
bio
});
}

export async function updatePreferences(updates) {
return apiCall('profile', 'update_preferences', updates);
}

export async function createApiKey(name) {
return apiCall('profile', 'create_api_key', {
name
});
}

export async function revokeApiKey(key_id) {
return apiCall('profile', 'revoke_api_key', {
key_id
});
}

export async function createWebhook(url, events) {
return apiCall('profile', 'create_webhook', {
url,
events
});
}

export async function updateWebhook(
webhook_id,
updates
) {
return apiCall('profile', 'update_webhook', {
webhook_id,
...updates
});
}

export async function deleteWebhook(webhook_id) {
return apiCall('profile', 'delete_webhook', {
webhook_id
});
}

export async function saveParentGuardian(payload) {
return apiCall('profile', 'save_parent_guardian', payload);
}

export async function requestDataExport() {
return apiCall('profile', 'request_data_export', {});
}

export async function requestAccountDeletion() {
return apiCall('profile', 'request_account_deletion', {});
}

export async function getCurriculumLevels() {
return getRequest(
'curriculum',
'levels'
);
}

export async function getGroups(levelId) {
return getRequest(
'curriculum',
'groups',
{
level_id: levelId
}
);
}

export async function getUnits(filters = {}) {
return getRequest(
'curriculum',
'units',
filters
);
}

export async function getUnitBreadcrumb(unitId) {
return getRequest(
'curriculum',
'breadcrumb',
{
unit_id: unitId
}
);
}

export async function getQuizTopics(unitId) {
return getRequest(
'quiz',
'get_quiz_topics',
{
unit_id: unitId
}
);
}

export async function listQuizTopics(groupId) {
return getRequest(
'quiz',
'list_quiz_topics',
groupId
? { group_id: groupId }
: {}
);
}

export async function getQuizBlock(
unitId,
block
) {
return getRequest(
'quiz',
'get_quiz_block',
{
unit_id: unitId,
block_number: block
}
);
}

export async function checkDailyRetry(
unitId,
block
) {
return getRequest(
'quiz',
'check_daily_retry',
{
unit_id: unitId,
block_number: block
}
);
}

export async function checkQuizAnswer(payload) {
return apiCall(
'quiz',
'quiz_check_answer',
payload
);
}

export async function startQuizSession(
unitId,
block,
state = {}
) {
return apiCall(
'quiz',
'quiz_start_session',
{
unit_id: unitId,
block_number: block,
state
}
);
}

export async function trackTabSwitch(
unitId,
block
) {
return apiCall(
'quiz',
'quiz_tab_switch',
{
unit_id: unitId,
block_number: block
}
);
}

export async function submitQuizWithSession(
unitId,
block,
answers,
timeTaken
) {
return apiCall(
'quiz',
'quiz_submit_with_session',
{
unit_id: unitId,
block_number: block,
answers,
time_taken: timeTaken
}
);
}

export async function getQuizSessionStatus() {
return getRequest(
'quiz',
'quiz_session_status'
);
}

export async function addQuizQuestionsBatch(
unitId,
questions
) {
return apiCall(
'quiz',
'add_quiz_questions_batch',