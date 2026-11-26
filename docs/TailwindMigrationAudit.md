# Sitewide Tailwind Migration Audit

Base audited: `main` at `9883fe099bab75bb116d5ce40b380b438f2feb9c` (PR #227).

## Review rules
- Read every listed source file from first line to last line before changing its presentation.
- Preserve behavior, data flow, accessibility, responsive behavior, and authentication/security logic.
- Use the central Aliver palette, Maven Pro typography, Tailwind utilities, and shared contracts in `src/design-system.jsx` where they genuinely reduce duplication.
- Keep dynamic inline styles only when values are runtime-driven (for example chart geometry, progress widths, pointer coordinates, measured dimensions, or user-selected colors); replace static presentation styles with Tailwind classes.
- Use a card only for a distinct content object that benefits from a bounded surface (for example a resource tile, independent chart, result/summary panel, or actionable item). Do not wrap page sections, forms, tables, navigation, or ordinary text groups in cards by default.
- Do not add new CSS files. Keep any genuinely necessary non-utility CSS in `src/styles.css` and remove obsolete selectors only after confirming no remaining consumers.
- Page titles use a consistent title/description/meta rhythm. An illustration slot is opt-in and appears only when a page explicitly supplies a meaningful illustration; do not reserve empty illustration boxes or add artwork to every section.
- Section headings reserve readable space between the title/description and the following content. Do not force subtitles or illustrations into sections that do not need them.
- Record each file as reviewed and migrated, reviewed and already aligned, or blocked; do not mark a file complete from a filename scan alone.

## Baseline findings
- 211 files under `src/` (181 JSX, 29 JS, 1 CSS), approximately 41,128 lines.
- 41 page modules, 104 component modules, and 30 feature modules.
- One stylesheet exists: `src/styles.css` (346 lines after removing page-specific profile/quiz/assistant blocks, legacy generic aliases, unused layout/footer/mobile-menu selectors and redundant component rules; shared `ab-*` and homepage hero primitives remain intentionally centralized).
- Stylesheet review found duplicate base/body/focus declarations, broad global heading-to-paragraph spacing with `!important`, color utility overrides, overlapping profile rules, and legacy page-scoped selectors. Duplicate base/focus declarations, profile rules, generic legacy aliases and unused page/layout/footer/mobile-menu blocks have been removed. Global heading spacing and a small set of palette compatibility overrides remain centralized pending visual regression review.
- Central `UI` contracts now cover page headings, forms, buttons, cards, quiz, profile, challenge, resource, reading and empty-state surfaces; shared `ab-*` Tailwind `@apply` contracts remain for core controls and the homepage hero.
- Static presentation inline styles have been replaced across migrated active pages. Remaining inline styles are retained only where values are runtime-derived (chart geometry, progress widths, crop/preview coordinates, configured imagery, logo dimensions, and measured footer offsets).
- Baseline `npm run build` passes (3,352 modules transformed). `npm run test:security` passes (18/18). The verification runtime is Node 25.9 while the project specifies Node 22.x; the build emits an existing mixed static/dynamic import warning for `src/utils/cache.js`.

## File-by-file checklist

### Central stylesheet (1 files)

- [x] `src/styles.css` — audited line by line and reduced to the single Tailwind entrypoint: Aliver palette/theme tokens, global base/accessibility rules, shared `ab-*` control/card/form/status/reading contracts, and the intentional homepage hero image/overlay primitives. Removed page-specific profile, quiz, assistant, blog, dashboard, generic `.section/.card/.btn`, legacy layout/footer/mobile-menu, and unused selector blocks. No second stylesheet was added.

### Design system (1 files)

- [x] `src/design-system.jsx` — reviewed; central contracts now include shared page-title/section-heading, quiz, profile, challenge, form, card, and status compositions.

### Pages (41 files)

- [x] `src/pages/AboutPage.jsx` — migrated the page hero to responsive Tailwind background/overlay utilities and removed the shared custom hero selector; runtime CMS hero image remains data-driven.
- [x] `src/pages/Advertise.jsx` — reviewed end-to-end; removed static inline section colors and legacy page-specific selectors, using full-width solid primary/secondary bands and utility-based campaign cards.
- [x] `src/pages/AdvertiseCreate.jsx` — reviewed end-to-end (1,171 lines); centralized PageHeader, input/select, button, and error contracts. Campaign configuration, validation, pricing calculation, submission sequence, and payloads remain unchanged.
- [x] `src/pages/AdvertisePayment.jsx` — reviewed end-to-end; migrated heading, form input, status messages, buttons, and dark-panel contrast to shared contracts. Payment lookup and verification flow unchanged.
- [x] `src/pages/Auth.jsx` — reviewed; auth-specific presentation is already composed in the single central Tailwind stylesheet via `@apply` contracts. Authentication, passkey, MFA and onboarding flows were intentionally left unchanged.
- [x] `src/pages/BlogPage.jsx` — reviewed end-to-end; article listing/detail layouts already use Tailwind utilities; removed the remaining page-specific wrapper selector while preserving cached loading, article retrieval, sharing, and content rendering.
- [x] `src/pages/ChallengeRunner.jsx` — reviewed; replaced legacy cartoon/page/hero/button selectors with responsive Tailwind panels, solid primary/secondary tones and a clear activity icon; challenge loading, validation, routing and reward flow unchanged.
- [x] `src/pages/Challenges.jsx` — reviewed end-to-end; removed static inline background colors and dark/blue-only styling; full-width primary/secondary section bands and shared challenge cards applied. Empty-state illustration retained because it provides meaningful context.
- [x] `src/pages/Classroom.jsx` — reviewed; page composition is already utility-first and contains no classroom-specific stylesheet selectors.
- [x] `src/pages/ClassroomRoom.jsx` — reviewed; room, session, messaging, participant, and report-dialog surfaces use Tailwind utilities; no custom classroom selectors remain.
- [x] `src/pages/ClinicalSimulationsPage.jsx` — migrated listing/detail, restricted, loading and empty states to shared PageHeader/card/status contracts and Tailwind; case retrieval and access behavior unchanged.
- [x] `src/pages/CommunityPage.jsx` — reviewed; replaced the static inline hero background and legacy wrapper class with a solid primary section and semantic page wrapper; community/mood/weekly-challenge data flow unchanged.
- [x] `src/pages/ContactPage.jsx` — migrated the contact hero background, overlay and responsive positioning to Tailwind utilities; contact form validation/submission unchanged.
- [x] `src/pages/CurriculumNodePage.jsx` — reviewed end-to-end; uses the shared page heading and curriculum tile contracts, and removes unnecessary outer section cards.
- [x] `src/pages/Dashboard.jsx` — reviewed for presentation contracts; the page already composes its sections, cards, charts, skeletons, and responsive layouts from Tailwind utility constants. Removed the now-unused dashboard-specific stylesheet selectors; dashboard data, refresh cadence, and chart behavior unchanged.
- [x] `src/pages/Donate.jsx` — migrated the donation hero fallback image/position/overlay to Tailwind utilities while preserving the configured runtime hero image and payment flows.
- [x] `src/pages/FaqPage.jsx` — reviewed; removed the FAQ page wrapper selector and now uses a solid primary-50 section band with a responsive content width.
- [x] `src/pages/FlashcardsPage.jsx` — reviewed end-to-end; removed static inline colors, uses full-width solid primary section background, and applies shared page/deck contracts. The introductory illustration remains because it supports the page hero.
- [x] `src/pages/Glossary.jsx` — reviewed; glossary caching, category/term retrieval, search filtering and related-term navigation remain unchanged; removed the now-unneeded CSS-variable color resolver.
- [x] `src/pages/GlossaryView.jsx` — fully rewritten with responsive Tailwind layout, shared form/button contracts, accessible term navigation, definitions, metadata and related resource groups; removed all glossary-specific classes and inline CSS variables.
- [x] `src/pages/Home.jsx` — reviewed end-to-end; homepage data loading, cache usage, level/group scoping, idle secondary-data fetches, newsletter and chat actions are presentation-independent and remain unchanged.
- [x] `src/pages/LegalPage.jsx` — reviewed; removed dynamic hard-coded pastel backgrounds and legacy legal selectors, using a single document surface with clear section dividers.
- [x] `src/pages/NoteDetail.jsx` — reviewed end-to-end; long-form note typography moved to the shared reading-content contract, redundant arbitrary descendant utilities removed, and feedback/discussion sections no longer use unnecessary outer cards.
- [x] `src/pages/NoteLearningExplanation.jsx` — reviewed end-to-end; shared page, card, and form contracts applied, and history empty state now uses the shared empty-state component.
- [x] `src/pages/NotesPage.jsx` — reviewed end-to-end; page shell, headings, section kickers, and resource cards now use central Tailwind contracts. Existing purposeful empty-state illustration retained.
- [x] `src/pages/PageInfo.jsx` — migrated standalone header, responsive mobile drawer, loading/error states, dynamic content blocks, callouts, lists and responsive tables to Tailwind/shared button contracts; navigation and dynamic page content behavior preserved.
- [x] `src/pages/PastPapers.jsx` — reviewed active route end-to-end; replaced all `pp-*` selectors and static review-star inline colors with Tailwind utilities/shared input contracts. Search, filters, presets, bookmarks, downloads, reviews, pagination and modal behavior remain unchanged.
- [x] `src/pages/PdfLibraryPage.jsx` — reviewed end-to-end; replaced legacy PDF selectors and static inline colors with PageHeader, Tailwind section bands, responsive sort controls, and utility-based PDF resource tiles. Download/access behavior remains unchanged.
- [x] `src/pages/Profile.jsx` — migrated the complete profile overview, category navigation, tabs, account/security, devices, preferences, notifications, referral, billing, certificates, API keys and webhooks surfaces into centralized `UI.profile` Tailwind contracts. Removed all profile-specific stylesheet selectors, theme-driven static inline styles and custom toggle-switch styling. The only remaining inline style is the runtime password-strength progress width; profile/auth/API workflows remain unchanged.
- [x] `src/pages/QuestionBankPage.jsx` — reviewed end-to-end; migrated filters, question cards, selection states, pagination and custom-test builder to PageHeader/shared form/button contracts and Tailwind utilities. Search, selection limits, save/archive and secure test launch logic unchanged.
- [x] `src/pages/Quiz.jsx` — completed the full 1,196-line render migration to Tailwind/shared quiz contracts; removed legacy `quiz-*` selectors and static inline presentation styles. Session creation, answer saving/submission, integrity monitoring, timers, review, access and assessment logic remain unchanged.
- [x] `src/pages/QuizAttemptResult.jsx` — reviewed end-to-end; removed legacy page/card classes and migrated result, answer review, status and actions to shared contracts.
- [x] `src/pages/QuizReview.jsx` — reviewed end-to-end; replaced legacy CSS classes with Tailwind and shared controls, kept marking workflow and validation logic unchanged.
- [x] `src/pages/Recall.jsx` — migrated active recall loading, intro, due banner, question/cloze session, feedback, confidence, review, report and modal surfaces to Tailwind/shared contracts; removed all `recall-*`, legacy `section/card/chip/btn` selectors and the gradient progress variant. Session, answer evaluation, confidence, XP, review queue and recommendation logic unchanged.
- [x] `src/pages/Resources.jsx` — reviewed; data/cache lifecycle and routing are already presentation-independent, with no custom styling selectors to migrate.
- [x] `src/pages/TutorApply.jsx` — reviewed end-to-end; replaced all inline CSS variables, legacy section/card/badge selectors and arbitrary level colors with PageHeader, shared card/status/button contracts and Tailwind. Application status, level/class/topic selection and submission flow unchanged.
- [x] `src/pages/TutorDashboard.jsx` — reviewed end-to-end; removed all inline styles and legacy section/card/alert/badge classes; migrated approval state, classroom creation form, active-room status and actions to shared contracts/Tailwind. Tutor access and classroom API behavior unchanged.
- [x] `src/pages/TutorMarketplace.jsx` — migrated hero, search/filter bands, tutor result heading and grid backgrounds from arbitrary inline hex colors to solid Aliver primary/secondary surfaces; select controls now use the shared select contract. Tutor fetching, filters and contact requests unchanged.
- [x] `src/pages/TutorProfile.jsx` — migrated profile, loading/error, avatar, biography and detail panels to shared card and Tailwind utilities; tutor retrieval unchanged.
- [x] `src/pages/challenges/QuizChallengePage.jsx` — reviewed end-to-end; removed dark/blue-only styling in favor of central Aliver contracts for page, panels, question options, progress and actions. Challenge logic untouched.
- [!] `src/pages/past-papers.jsx` — unreferenced legacy duplicate; no import or route reference found. `/past-papers` uses `src/pages/PastPapers.jsx`, which is migrated. Retained this orphaned file rather than deleting source without approval.

### Components (104 files)

- [x] `src/components/AdminLauncher.jsx` — reviewed; launcher is already utility-based and does not alter administrator authentication.
- [x] `src/components/Advertising/AdCampaignSuccess.jsx` — reviewed end-to-end; aligned campaign progress, summary and action surfaces with Tailwind palette and shared buttons.
- [x] `src/components/Advertising/AdSlot.jsx` — reviewed; ad slot layout and responsive placeholders are Tailwind-based with no custom stylesheet selectors.
- [x] `src/components/Advertising/AdStepIcon.jsx` — reviewed; icon step component is utility-based with no custom stylesheet selectors.
- [x] `src/components/Advertising/AdsHomeSection.jsx` — reviewed; replaced arbitrary lavender background/border colors with the solid secondary palette and retained its promotional illustration/CTA.
- [x] `src/components/AnimatedActionButton/AnimatedActionButton.jsx` — reviewed; action button uses Tailwind utilities and preserves motion/interaction behavior.
- [x] `src/components/Badge/Badge.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/BiopharmToggle/BiopharmToggle.jsx` — reviewed; toggle uses Tailwind utility states and preserves controlled/uncontrolled behavior.
- [x] `src/components/Breadcrumb/Breadcrumb.jsx` — reviewed; breadcrumb spacing, separators, and link/current states now use central palette contracts.
- [x] `src/components/Button/Button.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/Card/Card.jsx` — reviewed; shared Card is based on central `UI.card` and supports caller class composition/loading state.
- [x] `src/components/Chip/Chip.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/ClassSwitcher/ClassSwitcher.jsx` — reviewed; level-switching control already uses Tailwind utilities and preserves selection/navigation behavior.
- [x] `src/components/Container/Container.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/Container/Grid/Grid.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/ContentSwitcher/ContentSwitcher.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/CookieConsent/CookieConsent.jsx` — reviewed; consent preferences, modal and controls are already Tailwind-based; consent persistence and choices unchanged.
- [x] `src/components/Curriculum/InteractiveSymbolExplorer.jsx` — reviewed; interactive diagram, option, and active-detail surfaces use central contracts; dynamic marker coordinates remain runtime-driven.
- [x] `src/components/DynamicActions.jsx` — reviewed; both internal links and external anchors now use the shared `ab-btn` contract and palette variants; destination templating and action visibility logic unchanged.
- [x] `src/components/EmptyState/EmptyState.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/ErrorState/ErrorState.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/FileUpload/FileUpload.jsx` — reviewed; upload/dropzone/progress/error surfaces are utility-based with no custom stylesheet selectors.
- [x] `src/components/FlashcardDeckView.jsx` — reviewed end-to-end; flashcard mode surfaces now use the Aliver palette and shared form/card contracts; runtime study state and behavior preserved.
- [x] `src/components/FlashcardWelcome.jsx` — reviewed; welcome flip panels now use central primary/secondary palette contracts.
- [x] `src/components/Flashcardprogress.jsx` — reviewed; completion summary uses shared card contract and palette-aligned result colors.
- [x] `src/components/GlobalLoader/GlobalLoader.jsx` — reviewed; loading surface and animation are utility-based with no custom selectors.
- [!] `src/components/Hero/Hero.jsx` — reviewed; no imports or route references found in active source. Existing component retained as an unreferenced legacy module, not included in active-page styling changes.
- [x] `src/components/Icon/Icon.jsx` — reviewed; icon component forwards utility className and supports existing icon aliases; no CSS migration required.
- [x] `src/components/Input/Input.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/Layout/Layout.jsx` — reviewed; global header/footer, footer navigation, wave SVG and page shell already use Tailwind; logo dimensions remain runtime-configured. Footer visibility and link routing preserved.
- [x] `src/components/LearningJourney/LearningJourney.jsx` — reviewed; section heading and stage cards use shared contracts, and resource actions are now list rows rather than nested cards.
- [x] `src/components/Loading/PageSkeleton.jsx` — reviewed; page skeleton layout is already Tailwind-based.
- [x] `src/components/Maintenance/MaintenanceGate.jsx` — reviewed; maintenance gate and fallback states use Tailwind utilities; gate behavior unchanged.
- [x] `src/components/Modal/Modal.jsx` — reviewed; shared modal overlay, panel and close controls are Tailwind-based.
- [x] `src/components/NetworkStatus/NetworkStatus.jsx` — reviewed; network status banner and retry controls use Tailwind utilities.
- [x] `src/components/NotFoundPage.jsx` — reviewed; 404 state already uses Tailwind layout, semantic links and responsive utilities.
- [x] `src/components/NotificationBell/NotificationBell.jsx` — reviewed; notification bell/dropdown are utility-based; runtime placement remains dynamic.
- [x] `src/components/NotificationCenter/NotificationCenter.jsx` — reviewed; notification center list/empty/loading states use Tailwind utilities; notification data behavior unchanged.
- [x] `src/components/PageHeader/PageHeader.jsx` — reviewed; consumes central contracts, supports an additive wrapper class, and exposes an opt-in illustration slot.
- [x] `src/components/PageTransition.jsx` — reviewed; route transition wrapper is presentation-only and uses existing utility classes.
- [x] `src/components/ProfilePictureUpload/ProfilePictureUpload.jsx` — reviewed; upload surface uses Tailwind; remaining inline styles are runtime crop/preview positioning.
- [x] `src/components/ProgressBar/ProgressBar.jsx` — reviewed; progress fill width remains runtime-driven, and removed the gradient variant in favor of solid primary utility classes. (not changed in this batch; flashcard page now requests the solid primary variant).
- [x] `src/components/RichText/RichText.jsx` — reviewed; rich-text rendering uses semantic utility typography and preserves sanitized content behavior.
- [n/a] `src/components/ScrollMemory.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/components/ScrollToTop.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [x] `src/components/SearchOverlay/SearchOverlay.jsx` — migrated search input to shared input contract, replaced legacy spinner class with Spinner, and moved close icon sizing to Tailwind; search debounce, grouping and navigation unchanged.
- [x] `src/components/Select/Select.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [n/a] `src/components/Seo/Seo.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [x] `src/components/Skeleton/Skeleton.jsx` — reviewed; skeleton blocks use Tailwind and retain runtime width/height dimensions.
- [x] `src/components/Spinner/Accordion/Accordion.jsx` — reviewed; accordion uses Tailwind transition and disclosure states.
- [x] `src/components/Spinner/Spinner.jsx` — reviewed; spinner is a utility-based shared component.
- [x] `src/components/SplitCard/SplitCard.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/StatCard/StatCard.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/StatsGrid/StatsGrid.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/StickyNotePolaroidFrame/StickyNotePolaroidFrame.jsx` — reviewed; illustration frame uses Tailwind; remaining style values are runtime decoration/rotation parameters.
- [x] `src/components/StorysetIllustration.jsx` — reviewed; illustration component uses responsive utility sizing and preserves asset/alt-text handling.
- [x] `src/components/Textarea/Textarea.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/Toast/Badge/Badge.jsx` — reviewed; badge is a utility-based shared status component.
- [x] `src/components/Toast/Toast.jsx` — reviewed; toast stack and variants use Tailwind utility classes.
- [x] `src/components/TurnstileWidget.jsx` — reviewed; Turnstile wrapper uses utility layout and leaves provider/security behavior untouched.
- [x] `src/components/access/AccessDenied.jsx` — reviewed; access-denied presentation uses Tailwind utilities; access decision logic unchanged.
- [x] `src/components/access/ContentAccessGuard.jsx` — reviewed; guard is logic-only and renders shared access states without custom CSS.
- [x] `src/components/access/PendingApprovalScreen.jsx` — reviewed; pending approval state is Tailwind-based; approval logic unchanged.
- [x] `src/components/buttons/ThreeDButton.jsx` — reviewed; shared 3D action button is utility-based and preserves motion/press interaction.
- [x] `src/components/buttons/slide-to-confirm-button.jsx` — reviewed; already Tailwind-only. Runtime transform/track measurement remain dynamic, pointer and keyboard interaction preserved.
- [x] `src/components/charts/AnalyticsCharts.jsx` — reviewed; chart containers/cards use Tailwind, and remaining inline chart heights are runtime sizing values for responsive Recharts rendering.
- [x] `src/components/charts/BarChart.jsx` — reviewed; responsive chart dimensions and SVG plot geometry remain runtime-driven; wrapper presentation uses Tailwind.
- [x] `src/components/charts/ChartBadge.jsx` — reviewed; badge variants are utility-based.
- [x] `src/components/charts/ChartCard.jsx` — reviewed; shared chart panel uses Tailwind card/header/summary contracts.
- [x] `src/components/charts/ChartExportButton.jsx` — reviewed; export action and dropdown are Tailwind-based; export logic unchanged.
- [x] `src/components/charts/ChartRegistry.jsx` — reviewed; chart registry is configuration-only and has no visual styles.
- [x] `src/components/charts/ChartSegmentedControl.jsx` — reviewed; segmented controls use Tailwind state classes.
- [x] `src/components/charts/ChartSelect.jsx` — reviewed; select control uses Tailwind form styling.
- [x] `src/components/charts/ChartTooltip.jsx` — reviewed; inline tooltip positioning is runtime chart geometry; presentation remains Tailwind.
- [x] `src/components/charts/ChartWhenVisible.jsx` — reviewed; intersection/visibility behavior remains runtime-driven; wrapper is utility-based.
- [x] `src/components/charts/ContentAnalytics.jsx` — reviewed; analytics panels and explanatory copy use Tailwind; chart data behavior unchanged.
- [x] `src/components/charts/DonutChart.jsx` — reviewed; responsive SVG sizing remains runtime-driven; chart surface uses Tailwind and solid palette segment colors.
- [x] `src/components/charts/DualAreaTrend.jsx` — reviewed; chart uses solid series fills with low-opacity area underlays, not gradients; responsive chart height remains runtime-driven.
- [x] `src/components/charts/LineAreaChart.jsx` — reviewed; responsive SVG sizing remains runtime-driven; no gradients or custom selectors.
- [x] `src/components/charts/RadarChart.jsx` — reviewed; responsive SVG sizing remains runtime-driven; solid series color and Tailwind chart surface.
- [n/a] `src/components/charts/index.js` — barrel export only; no visual markup or styles.
- [x] `src/components/charts/useChartTheme.js` — reviewed; chart theme is a palette-token helper with no UI markup.
- [x] `src/components/dashboard/HomeDashboardCard.jsx` — removed the nested white dashboard panel wrapper so the dashboard sits directly on its full-width primary section; metric cards are now solid white surfaces with shared borders.
- [x] `src/components/quiz/QuizAnswerLoader.jsx` — reviewed; SVG animation and runtime status colors retained because they are intrinsic to the feedback indicator.
- [x] `src/components/quiz/QuizChallenges.jsx` — reviewed end-to-end; shared quiz section, stat, card, and palette contracts applied.
- [x] `src/components/quiz/QuizDashboard.jsx` — reviewed end-to-end; shared quiz section, stat, card, and palette contracts applied.
- [x] `src/components/quiz/QuizHero.jsx` — reviewed end-to-end; shared quiz section, stat, card, and palette contracts applied.
- [x] `src/components/quiz/QuizLearningPath.jsx` — reviewed end-to-end; shared quiz section, stat, card, and palette contracts applied.
- [x] `src/components/quiz/QuizQuestionRenderer.jsx` — reviewed end-to-end; question, option, label, field, mark-for-review, and feedback states now use central contracts across all question types.
- [x] `src/components/quiz/QuizWeakAreas.jsx` — reviewed end-to-end; shared quiz section, stat, card, and palette contracts applied.
- [x] `src/components/recall/RecallAnalyticsHub.jsx` — reviewed; chart/dashboard surfaces are Tailwind-based with no legacy recall selectors; removed ignored gradient props and inline icon colors, using solid palette classes; data aggregation and graph switching unchanged.
- [x] `src/components/recall/RecallInsightsTab.jsx` — reviewed; no custom stylesheet selectors remain.
- [x] `src/components/recall/RecallLeaderboardTab.jsx` — reviewed; no custom stylesheet selectors remain.
- [x] `src/components/recall/RecallProgressTab.jsx` — removed remaining `recall-stat-card-*` classes, aligned XP progress to solid primary and retained analytics values/mastery rendering.
- [x] `src/components/ui/AnimatedJoinButton.jsx` — reviewed; join CTA uses Tailwind utilities and preserves its click/animation behavior.
- [x] `src/components/ui/DownloadButton.jsx` — reviewed; download action uses Tailwind/shared button styling.
- [x] `src/components/ui/PremiumAccessButton.jsx` — reviewed; premium access action uses Tailwind/shared button styling.
- [n/a] `src/components/ui/empty-utils.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [x] `src/components/ui/empty.jsx` — reviewed; composable empty-state primitives are already Tailwind-based.
- [x] `src/components/ui/empty8.jsx` — reviewed; PDF-library empty-state variant is Tailwind-based and remains used by the active PDF page.
- [!] `src/components/ui/liquid-glass-card.jsx` — unreferenced legacy visual component; only imported by the unreferenced marquee-card module. Kept intact, not part of active UI.
- [!] `src/components/ui/marquee-card.jsx` — unreferenced legacy visual component; no active route or component imports it. Kept intact rather than deleting source without approval.
- [!] `src/components/ui/marquee.jsx` — unreferenced legacy marquee component; only imported by the unreferenced marquee-card module. Kept intact, not part of active UI.
- [x] `src/components/ui/sign-in-page.jsx` — reviewed; sign-in page composition uses Tailwind utilities; authentication behavior is unchanged.

### Feature modules (30 files)

- [x] `src/features/Notes/NotesSection.jsx` — reviewed end-to-end; removed redundant section/topic card wrappers, retained individual note resource tiles, and reused the shared reading-content contract.
- [x] `src/features/chat/AIAssistant.jsx` — migrated launcher, panel, header, mode tabs, live-chat entry, welcome/starter prompts, message bubbles, errors and composer to Tailwind/shared input/status contracts. Removed the assistant-specific stylesheet block and animated bubble selector dependencies; dynamic footer avoidance remains a runtime bottom offset.
- [x] `src/features/chat/ChatWidget.jsx` — reviewed; already Tailwind-based; aligned chat header text and offline indicator to primary/secondary Aliver palette.
- [x] `src/features/classroom/ClassroomOnboarding.jsx` — reviewed end-to-end; removed onboarding-specific classes and mapped level/class/topic selection, loading, and empty states to Tailwind utilities.
- [x] `src/features/classroom/ClassroomSection.jsx` — reviewed; removed section/classroom CSS classes, retained the configured background image as runtime data, and moved sizing, overlay, headings, grid and actions to Tailwind.
- [x] `src/features/classroom/ClassroomTeaser.jsx` — reviewed; now selects its solid primary background through the shared semantic teaser tone prop.
- [x] `src/features/classroom/CollaborativeWhiteboard.jsx` — reviewed; whiteboard controls are utility-based, with the sole inline style retained for runtime drawing/coordinate presentation.
- [x] `src/features/community/CommunitySection.jsx` — reviewed; removed legacy section/card classes and all static inline styles, replacing them with responsive Tailwind sections, shared status contracts and activity rows.
- [x] `src/features/contact/ContactSection.jsx` — reviewed end-to-end; contact form, reason controls, status feedback, FAQ disclosures, and support guidance use Tailwind utilities and shared form components.
- [x] `src/features/flashcards/FlashcardSection.jsx` — reviewed; replaced legacy section/preview/card classes with Tailwind layout and card utilities; study and browse callbacks preserved.
- [x] `src/features/home/BlogGrid.jsx` — reviewed; migrated legacy home/blog/card classes to shared section-heading and resource-card contracts, with responsive Tailwind layout.
- [x] `src/features/home/EducationalShowcase.jsx` — fully migrated the five-step interactive learning showcase to Tailwind/shared contracts, including pathway selection, curriculum preview, osmosis demonstration, quiz feedback and navigation; removed all bespoke showcase selectors.
- [x] `src/features/home/FaqAccordion.jsx` — reviewed end-to-end; migrated standalone FAQ explorer and homepage accordion to Tailwind utilities, removed decorative duplicate illustrations, preserved filtering, category selection, hash navigation, question expansion, and copy-link behavior.
- [x] `src/features/home/HomeView.jsx` — reviewed end-to-end; migrated curriculum headings, challenge/recall sections, dashboard/feature wrappers and continuation rows to Tailwind/shared contracts. Dynamic progress widths remain runtime-driven.
- [x] `src/features/home/LernwickHomeHero.jsx` — reviewed; hero already uses shared `UI.hero` contracts and centralized hero background/vignette primitives; content and CTA behavior preserved.
- [x] `src/features/home/LernwickHomeSections.jsx` — reviewed end-to-end; replaced arbitrary hex section backgrounds with solid Aliver primary/secondary bands and aligned dark-section text contrast.
- [x] `src/features/home/NewsletterForm.jsx` — reviewed; already uses Tailwind and shared Input/Button primitives; newsletter submission state remains unchanged.
- [x] `src/features/home/PricingCards.jsx` — reviewed; removed inline check-icon styles and arbitrary blue color, retaining subscription routing and plan calculations.
- [x] `src/features/home/SectionTeaser.jsx` — reviewed; replaced dynamic inline background colors with semantic primary/secondary palette tones while preserving illustration/image selection and CTA behavior.
- [x] `src/features/home/StatsGrid.jsx` — reviewed; replaced arbitrary blue and gray backgrounds with solid Aliver palette classes; animated metric and ranking behavior preserved.
- [x] `src/features/home/TeamScroll.jsx` — reviewed; migrated legacy carousel/card classes to responsive Tailwind utilities and preserved auto-scroll, reduced-motion, pointer pause, and manual navigation.
- [x] `src/features/home/TestimonialSlider.jsx` — reviewed; already Tailwind-based with responsive testimonial surfaces and no custom selectors.
- [x] `src/features/mood/MoodCheckSection.jsx` — reviewed; migrated mood options, textarea, submit and success feedback to Tailwind/shared form/status contracts.
- [x] `src/features/pdfs/PdfLibrarySection.jsx` — reviewed; migrated topic groups, PDF items, and topic navigation to Tailwind, and replaced the invalid `:contains()` selector with stable topic IDs and `getElementById()` scrolling.
- [x] `src/features/pdfs/PdfPreviewModal.jsx` — replaced all legacy PDF modal selectors with responsive Tailwind overlay, header, iframe surface and footer actions; preview/download/close behavior unchanged.
- [x] `src/features/resources/ResourceIllustration.jsx` — replaced unused `resource-art-*` selector names with a single accessible Tailwind SVG icon contract; line-icon geometry remains unchanged.
- [x] `src/features/resources/ResourcesView.jsx` — reviewed end-to-end; removed static inline section colors and legacy page styling, retained responsive filters/search/resource navigation, and aligned categories with the Aliver palette.
- [x] `src/features/tutor-marketplace/TutorCard.jsx` — reviewed; retains shared `ab-card` contract and uses solid secondary surface for specialty details.
- [x] `src/features/tutor-marketplace/TutorMarketplaceSection.jsx` — reviewed; removed legacy section/grid/button selectors and migrated background overlay, headings, tutor grid, empty state and actions to Tailwind; configured background image remains data-driven.
- [x] `src/features/tutor-marketplace/TutorMarketplaceTeaser.jsx` — reviewed; now selects its solid secondary background through the shared semantic teaser tone prop.

### Application, data, context, hooks and utilities (34 files)

- [x] `src/App.jsx` — migrated feature-disabled fallback to a semantic Tailwind section and shared palette; route gating and maintenance boundaries unchanged.
- [n/a] `src/api/cachedClient.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/api/client.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/api/curriculumNavigation.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/api/sections.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [x] `src/contexts/AuthContext.jsx` — reviewed; provider logic is unchanged and its preview-mode banner already uses Tailwind utilities.
- [n/a] `src/contexts/ChatContext.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/contexts/I18nContext.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/contexts/LayoutContext.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/contexts/NotificationContext.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/contexts/ThemeContext.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/hooks/useContentAccess.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/hooks/useLevelFilter.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/hooks/useNetworkStatus.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/hooks/useRequireOnboarding.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/hooks/useSecurityUiLock.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/i18n/locales.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/lib/passkeyClient.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/main.jsx` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/cache.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/challengeConfig.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/donationFormatting.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/faqData.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/highlightBiologyTerms.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/learningDataCache.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/learningJourney.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/noteReading.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/notesPage.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/prefetchLearningPages.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/quizRuntime.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/runtimeErrors.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/scrollReveal.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/subscriptionNavigation.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.
- [n/a] `src/utils/uiPreferences.js` — reviewed; non-visual application logic/data utility with no component-specific className/style presentation to migrate.

