import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRequireOnboarding } from '../hooks/useRequireOnboarding';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useContentAccess } from '../hooks/useContentAccess';
import { useLayout } from '../contexts/LayoutContext';
import { useI18n } from '../contexts/I18nContext';
import { PendingApprovalScreen } from '../components/access/PendingApprovalScreen';
import { AccessDenied } from '../components/access/AccessDenied';
import { listClassrooms } from '../api/client';
import Icon from '../components/Icon/Icon';
import PageSkeleton from '../components/Loading/PageSkeleton';
import Button from '../components/Button/Button';
import AnimatedActionButton from '../components/AnimatedActionButton/AnimatedActionButton';
import EmptyState from '../components/EmptyState/EmptyState';
import StorysetIllustration from '../components/StorysetIllustration';

const STATUS = {
  live: { label: 'Live now', dot: 'bg-emerald-500', badge: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  open_floor: { label: 'Open discussion', dot: 'bg-teal-500', badge: 'border-teal-200 bg-teal-50 text-teal-800' },
  upcoming: { label: 'Upcoming', dot: 'bg-amber-500', badge: 'border-amber-200 bg-amber-50 text-amber-800' },
  ended: { label: 'Ended', dot: 'bg-slate-400', badge: 'border-slate-200 bg-slate-100 text-slate-600' },
  offline: { label: 'Offline', dot: 'bg-slate-400', badge: 'border-slate-200 bg-slate-100 text-slate-600' }
};

function RoomStatus({ status = 'offline' }) {
  const config = STATUS[status] || STATUS.offline;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${config.badge}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot} ${status === 'live' ? 'animate-pulse' : ''}`} />
      {config.label}
    </span>
  );
}

function RoomAction({ room, navigate }) {
  if (room.status === 'live' || room.status === 'open_floor') {
    return <AnimatedActionButton primaryText="Join classroom" secondaryText="Join now" onClick={() => navigate(`/classroom/${room.id}`)} />;
  }
  if (room.status === 'upcoming') {
    return (
      <Button size="sm" variant="secondary" disabled className="w-full justify-center">
        <Icon name="clock" />
        {room.scheduled_at ? new Date(room.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Scheduled'}
      </Button>
    );
  }
  return <Button size="sm" variant="ghost" disabled className="w-full justify-center">{STATUS[room.status]?.label || 'Unavailable'}</Button>;
}

export default function Classroom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isReady } = useRequireOnboarding();
  const access = useContentAccess();
  const { level, class_name, showAll, displayName } = useLevelFilter();
  const { groups, bootstrap, activeGroupId } = useLayout();
  const selectedGroupId = activeGroupId || user?.profile?.active_group_id || groups?.find((group) => group.name === class_name)?.id || null;
  const { t } = useI18n();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [groupRetry, setGroupRetry] = useState(0);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (!user || !Array.isArray(groups)) return;
    if (!selectedGroupId) {
      setRooms([]);
      setError('Your learning group or Pharmacy programme is not assigned yet. Please check your profile or contact an administrator.');
      setLoading(false);
      return;
    }
    setError(null);
  }, [groups, selectedGroupId, user, groupRetry]);

  const fetchRooms = useCallback(async ({ quiet = false } = {}) => {
    if (!selectedGroupId) {
      setRooms([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await listClassrooms(null, selectedGroupId);
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      setError("We couldn't load the classrooms. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (!isReady || !access.canAccess || access.isPending || !selectedGroupId) return;
    fetchRooms();
  }, [isReady, access.canAccess, access.isPending, selectedGroupId, fetchRooms]);

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);
    return component?.properties?.image_url || null;
  }

  if (!isReady || access.isPending) return <PendingApprovalScreen />;
  if (!access.canAccess) return <AccessDenied />;

  const levelName = displayName || level?.display_name || level?.id || '';
  const classLabel = class_name || '';
  const groupLabel = /pharmacy/i.test(levelName) ? 'Program' : (rooms[0]?.group_label || 'Class');
  const liveCount = rooms.filter((room) => room.status === 'live' || room.status === 'open_floor').length;
  const upcomingCount = rooms.filter((room) => room.status === 'upcoming').length;

  if (loading) {
    return <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><PageSkeleton variant="compact" /></div>;
  }

  return (
    <main className="min-h-screen w-full bg-primary-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-[1440px]">
      <section className="overflow-hidden rounded-[2rem] border border-primary-200 bg-white shadow-md">
        <div className="relative isolate overflow-hidden bg-primary-950 px-5 py-7 text-white sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full border-[36px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 h-56 w-56 rounded-full bg-secondary-400/10 blur-2xl" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-primary-100">
                <Icon name="users" />
                ALIVER LEARNING SPACE
              </div>
              <h1 className="m-0 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Your classroom
                {levelName && <span className="mt-2 block text-xl font-semibold text-primary-100 sm:text-2xl">{levelName}</span>}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-primary-100 sm:text-base">
                Meet your tutors, ask questions, and learn together in focused live sessions.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {classLabel && <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">{groupLabel}: {classLabel}</span>}
                {showAll && <span className="rounded-full border border-secondary-200/30 bg-secondary-400/15 px-3 py-1.5 text-xs font-semibold text-secondary-100">{t('common.allLevelsTeacher')}</span>}
              </div>
            </div>
            <StorysetIllustration name="teaching" alt="Teacher guiding learners in a classroom" className="hidden w-40 shrink-0 object-contain sm:block lg:w-48" />
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-8">
          <div className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm"><Icon name="radio" size="1.25rem" /></span>
              <div><p className="m-0 text-2xl font-extrabold text-slate-900">{liveCount}</p><p className="m-0 text-xs font-semibold text-slate-700">Live sessions</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm"><Icon name="calendar-clock" size="1.25rem" /></span>
              <div><p className="m-0 text-2xl font-extrabold text-slate-900">{upcomingCount}</p><p className="m-0 text-xs font-semibold text-slate-600">Upcoming sessions</p></div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-700 shadow-sm"><Icon name="users" size="1.25rem" /></span>
              <div><p className="m-0 text-2xl font-extrabold text-slate-900">{rooms.length}</p><p className="m-0 text-xs font-semibold text-slate-600">Available rooms</p></div>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="m-0 text-2xl font-bold tracking-tight text-primary-950">Explore sessions</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">Choose a live room or check what's scheduled next.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label="Classroom view">
                <button type="button" onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${viewMode === 'grid' ? 'bg-white text-primary-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                  <Icon name="grid" /> Grid
                </button>
                <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${viewMode === 'list' ? 'bg-white text-primary-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                  <Icon name="list" /> List
                </button>
              </div>
              <Button variant="secondary" size="sm" onClick={() => selectedGroupId ? fetchRooms({ quiet: true }) : setGroupRetry((value) => value + 1)} loading={refreshing || loading} className="min-h-10">
                <Icon name="refresh-cw" /> Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div role="alert" className="mb-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2"><Icon name="triangle-alert" />{error}</span>
              <Button variant="secondary" size="sm" onClick={() => fetchRooms()} className="shrink-0">Try again</Button>
            </div>
          )}

          {!error && rooms.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-10">
              <EmptyState
                image={getEmptyStateImage('classrooms')}
                icon="users"
                title="No classrooms available yet"
                description={`There are no active classrooms for ${classLabel ? `${groupLabel.toLowerCase()} ${classLabel}` : levelName || 'your selected learning pathway'} right now. Check back later for new sessions.`}
                action={<Button onClick={() => navigate('/tutor/apply')}><Icon name="user-pen" /> Apply to become a tutor</Button>}
              />
            </div>
          )}

          {!error && rooms.length > 0 && viewMode === 'grid' && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {rooms.map((room) => (
                <article key={room.id} className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-950/5">
                  <div className="relative h-44 overflow-hidden bg-primary-50">
                    <img
                      src={room.cover_image_url || room.topic_image_url || 'https://images.pexels.com/photos/8197525/pexels-photo-8197525.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop'}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute left-4 top-4"><RoomStatus status={room.status} /></div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-primary-700">
                      {room.group_name && <span>{room.group_label || 'Class'}: {room.group_name}</span>}
                      {room.unit_name && <><span className="text-slate-300">/</span><span>{room.unit_label || 'Topic'}: {room.unit_name}</span></>}
                    </div>
                    <h3 className="m-0 text-lg font-bold leading-7 text-primary-950">{room.title}</h3>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                      {room.tutor_name && <span className="inline-flex items-center gap-2"><Icon name="user-round" className="text-primary-600" />{room.tutor_name}</span>}
                      <span className="inline-flex items-center gap-2"><Icon name="users" className="text-primary-600" />{room.participant_count || 0} {(room.participant_count || 0) === 1 ? 'learner' : 'learners'}</span>
                    </div>
                    <div className="mt-auto pt-5"><RoomAction room={room} navigate={navigate} /></div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!error && rooms.length > 0 && viewMode === 'list' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_minmax(100px,0.6fr)_140px] gap-4 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
                <span>Classroom</span><span>Session status</span><span>Tutor</span><span>Participants</span><span>Action</span>
              </div>
              <div className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-1 gap-3 px-4 py-4 transition hover:bg-primary-50/30 md:grid-cols-[minmax(0,1.5fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_minmax(100px,0.6fr)_140px] md:items-center md:gap-4 md:px-5">
                    <div className="min-w-0"><h3 className="m-0 truncate text-sm font-bold text-slate-900">{room.title}</h3><p className="m-0 mt-1 truncate text-xs text-slate-500">{[room.group_name && `${room.group_label || 'Class'}: ${room.group_name}`, room.unit_name && `${room.unit_label || 'Topic'}: ${room.unit_name}`].filter(Boolean).join(' · ')}</p></div>
                    <div><RoomStatus status={room.status} /></div>
                    <div className="text-sm text-slate-700">{room.tutor_name || 'Tutor not listed'}</div>
                    <div className="text-sm text-slate-700">{room.participant_count || 0} learners</div>
                    <RoomAction room={room} navigate={navigate} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      </div>
    </main>
  );
}
