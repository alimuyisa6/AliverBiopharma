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
- One stylesheet exists: `src/styles.css` (927 lines).
- Stylesheet review found duplicate base/body/focus declarations, broad global heading-to-paragraph spacing with `!important`, color utility overrides, overlapping profile rules, and legacy page-scoped selectors. These are not being deleted blindly: each selector group must be checked against its actual JSX consumers and migrated before removal.
- The central `UI` contracts are currently used primarily by the home hero; most controls still duplicate literal class strings or legacy selectors.
- Static and dynamic inline styles coexist; they must be classified individually rather than removed indiscriminately.
- Baseline `npm run build` passes (3,352 modules transformed). `npm run test:security` passes (18/18). The verification runtime is Node 25.9 while the project specifies Node 22.x; the build emits an existing mixed static/dynamic import warning for `src/utils/cache.js`.

## File-by-file checklist

### Central stylesheet (1 files)

- [!] `src/styles.css` — reviewed line by line; cleanup blocked pending consumer-by-consumer migration and visual regression checks. Broad global spacing and legacy selectors remain intentionally in place for now.

### Design system (1 files)

- [x] `src/design-system.jsx` — reviewed; added shared page-title and section-heading class contracts.

### Pages (41 files)

- [ ] `src/pages/AboutPage.jsx` — pending line-by-line review
- [ ] `src/pages/Advertise.jsx` — pending line-by-line review
- [ ] `src/pages/AdvertiseCreate.jsx` — pending line-by-line review
- [ ] `src/pages/AdvertisePayment.jsx` — pending line-by-line review
- [ ] `src/pages/Auth.jsx` — pending line-by-line review
- [ ] `src/pages/BlogPage.jsx` — pending line-by-line review
- [ ] `src/pages/ChallengeRunner.jsx` — pending line-by-line review
- [ ] `src/pages/Challenges.jsx` — pending line-by-line review
- [ ] `src/pages/Classroom.jsx` — pending line-by-line review
- [ ] `src/pages/ClassroomRoom.jsx` — pending line-by-line review
- [ ] `src/pages/ClinicalSimulationsPage.jsx` — pending line-by-line review
- [ ] `src/pages/CommunityPage.jsx` — pending line-by-line review
- [ ] `src/pages/ContactPage.jsx` — pending line-by-line review
- [x] `src/pages/CurriculumNodePage.jsx` — reviewed end-to-end; uses the shared page heading and curriculum tile contracts, and removes unnecessary outer section cards.
- [ ] `src/pages/Dashboard.jsx` — pending line-by-line review
- [ ] `src/pages/Donate.jsx` — pending line-by-line review
- [ ] `src/pages/FaqPage.jsx` — pending line-by-line review
- [x] `src/pages/FlashcardsPage.jsx` — reviewed end-to-end; removed static inline colors, uses full-width solid primary section background, and applies shared page/deck contracts. The introductory illustration remains because it supports the page hero.
- [ ] `src/pages/Glossary.jsx` — pending line-by-line review
- [ ] `src/pages/GlossaryView.jsx` — pending line-by-line review
- [ ] `src/pages/Home.jsx` — pending line-by-line review
- [ ] `src/pages/LegalPage.jsx` — pending line-by-line review
- [x] `src/pages/NoteDetail.jsx` — reviewed end-to-end; long-form note typography moved to the shared reading-content contract, redundant arbitrary descendant utilities removed, and feedback/discussion sections no longer use unnecessary outer cards.
- [x] `src/pages/NoteLearningExplanation.jsx` — reviewed end-to-end; shared page, card, and form contracts applied, and history empty state now uses the shared empty-state component.
- [x] `src/pages/NotesPage.jsx` — reviewed end-to-end; page shell, headings, section kickers, and resource cards now use central Tailwind contracts. Existing purposeful empty-state illustration retained.
- [ ] `src/pages/PageInfo.jsx` — pending line-by-line review
- [ ] `src/pages/PastPapers.jsx` — pending line-by-line review
- [ ] `src/pages/PdfLibraryPage.jsx` — pending line-by-line review
- [ ] `src/pages/Profile.jsx` — pending line-by-line review
- [ ] `src/pages/QuestionBankPage.jsx` — pending line-by-line review
- [ ] `src/pages/Quiz.jsx` — pending line-by-line review
- [ ] `src/pages/QuizAttemptResult.jsx` — pending line-by-line review
- [ ] `src/pages/QuizReview.jsx` — pending line-by-line review
- [ ] `src/pages/Recall.jsx` — pending line-by-line review
- [ ] `src/pages/Resources.jsx` — pending line-by-line review
- [ ] `src/pages/TutorApply.jsx` — pending line-by-line review
- [ ] `src/pages/TutorDashboard.jsx` — pending line-by-line review
- [ ] `src/pages/TutorMarketplace.jsx` — pending line-by-line review
- [ ] `src/pages/TutorProfile.jsx` — pending line-by-line review
- [x] `src/pages/challenges/QuizChallengePage.jsx` — reviewed end-to-end; removed dark/blue-only styling in favor of central Aliver contracts for page, panels, question options, progress and actions. Challenge logic untouched.
- [ ] `src/pages/past-papers.jsx` — pending line-by-line review

### Components (104 files)

- [ ] `src/components/AdminLauncher.jsx` — pending line-by-line review
- [ ] `src/components/Advertising/AdCampaignSuccess.jsx` — pending line-by-line review
- [ ] `src/components/Advertising/AdSlot.jsx` — pending line-by-line review
- [ ] `src/components/Advertising/AdStepIcon.jsx` — pending line-by-line review
- [ ] `src/components/Advertising/AdsHomeSection.jsx` — pending line-by-line review
- [ ] `src/components/AnimatedActionButton/AnimatedActionButton.jsx` — pending line-by-line review
- [x] `src/components/Badge/Badge.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [ ] `src/components/BiopharmToggle/BiopharmToggle.jsx` — pending line-by-line review
- [x] `src/components/Breadcrumb/Breadcrumb.jsx` — reviewed; breadcrumb spacing, separators, and link/current states now use central palette contracts.
- [x] `src/components/Button/Button.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [ ] `src/components/Card/Card.jsx` — pending line-by-line review
- [x] `src/components/Chip/Chip.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [ ] `src/components/ClassSwitcher/ClassSwitcher.jsx` — pending line-by-line review
- [x] `src/components/Container/Container.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/Container/Grid/Grid.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/ContentSwitcher/ContentSwitcher.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [ ] `src/components/CookieConsent/CookieConsent.jsx` — pending line-by-line review
- [x] `src/components/Curriculum/InteractiveSymbolExplorer.jsx` — reviewed; interactive diagram, option, and active-detail surfaces use central contracts; dynamic marker coordinates remain runtime-driven.
- [ ] `src/components/DynamicActions.jsx` — pending line-by-line review
- [x] `src/components/EmptyState/EmptyState.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [x] `src/components/ErrorState/ErrorState.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [ ] `src/components/FileUpload/FileUpload.jsx` — pending line-by-line review
- [x] `src/components/FlashcardDeckView.jsx` — reviewed end-to-end; flashcard mode surfaces now use the Aliver palette and shared form/card contracts; runtime study state and behavior preserved.
- [x] `src/components/FlashcardWelcome.jsx` — reviewed; welcome flip panels now use central primary/secondary palette contracts.
- [x] `src/components/Flashcardprogress.jsx` — reviewed; completion summary uses shared card contract and palette-aligned result colors.
- [ ] `src/components/GlobalLoader/GlobalLoader.jsx` — pending line-by-line review
- [ ] `src/components/Hero/Hero.jsx` — pending line-by-line review
- [ ] `src/components/Icon/Icon.jsx` — pending line-by-line review
- [x] `src/components/Input/Input.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [ ] `src/components/Layout/Layout.jsx` — pending line-by-line review
- [x] `src/components/LearningJourney/LearningJourney.jsx` — reviewed; section heading and stage cards use shared contracts, and resource actions are now list rows rather than nested cards.
- [ ] `src/components/Loading/PageSkeleton.jsx` — pending line-by-line review
- [ ] `src/components/Maintenance/MaintenanceGate.jsx` — pending line-by-line review
- [ ] `src/components/Modal/Modal.jsx` — pending line-by-line review
- [ ] `src/components/NetworkStatus/NetworkStatus.jsx` — pending line-by-line review
- [ ] `src/components/NotFoundPage.jsx` — pending line-by-line review
- [ ] `src/components/NotificationBell/NotificationBell.jsx` — pending line-by-line review
- [ ] `src/components/NotificationCenter/NotificationCenter.jsx` — pending line-by-line review
- [x] `src/components/PageHeader/PageHeader.jsx` — reviewed; consumes central contracts, supports an additive wrapper class, and exposes an opt-in illustration slot.
- [ ] `src/components/PageTransition.jsx` — pending line-by-line review
- [ ] `src/components/ProfilePictureUpload/ProfilePictureUpload.jsx` — pending line-by-line review
- [ ] `src/components/ProgressBar/ProgressBar.jsx` — pending line-by-line review (not changed in this batch; flashcard page now requests the solid primary variant).
- [ ] `src/components/RichText/RichText.jsx` — pending line-by-line review
- [ ] `src/components/ScrollMemory.jsx` — pending line-by-line review
- [ ] `src/components/ScrollToTop.jsx` — pending line-by-line review
- [ ] `src/components/SearchOverlay/SearchOverlay.jsx` — pending line-by-line review
- [x] `src/components/Select/Select.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [ ] `src/components/Seo/Seo.jsx` — pending line-by-line review
- [ ] `src/components/Skeleton/Skeleton.jsx` — pending line-by-line review
- [ ] `src/components/Spinner/Accordion/Accordion.jsx` — pending line-by-line review
- [ ] `src/components/Spinner/Spinner.jsx` — pending line-by-line review
- [x] `src/components/SplitCard/SplitCard.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/StatCard/StatCard.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [x] `src/components/StatsGrid/StatsGrid.jsx` — reviewed; migrated shared layout/card/control styling to central `UI` Tailwind contracts.
- [ ] `src/components/StickyNotePolaroidFrame/StickyNotePolaroidFrame.jsx` — pending line-by-line review
- [ ] `src/components/StorysetIllustration.jsx` — pending line-by-line review
- [x] `src/components/Textarea/Textarea.jsx` — reviewed; migrated shared styling to central `UI` Tailwind contracts.
- [ ] `src/components/Toast/Badge/Badge.jsx` — pending line-by-line review
- [ ] `src/components/Toast/Toast.jsx` — pending line-by-line review
- [ ] `src/components/TurnstileWidget.jsx` — pending line-by-line review
- [ ] `src/components/access/AccessDenied.jsx` — pending line-by-line review
- [ ] `src/components/access/ContentAccessGuard.jsx` — pending line-by-line review
- [ ] `src/components/access/PendingApprovalScreen.jsx` — pending line-by-line review
- [ ] `src/components/buttons/ThreeDButton.jsx` — pending line-by-line review
- [ ] `src/components/buttons/slide-to-confirm-button.jsx` — pending line-by-line review
- [ ] `src/components/charts/AnalyticsCharts.jsx` — pending line-by-line review
- [ ] `src/components/charts/BarChart.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartBadge.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartCard.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartExportButton.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartRegistry.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartSegmentedControl.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartSelect.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartTooltip.jsx` — pending line-by-line review
- [ ] `src/components/charts/ChartWhenVisible.jsx` — pending line-by-line review
- [ ] `src/components/charts/ContentAnalytics.jsx` — pending line-by-line review
- [ ] `src/components/charts/DonutChart.jsx` — pending line-by-line review
- [ ] `src/components/charts/DualAreaTrend.jsx` — pending line-by-line review
- [ ] `src/components/charts/LineAreaChart.jsx` — pending line-by-line review
- [ ] `src/components/charts/RadarChart.jsx` — pending line-by-line review
- [ ] `src/components/charts/index.js` — pending line-by-line review
- [ ] `src/components/charts/useChartTheme.js` — pending line-by-line review
- [ ] `src/components/dashboard/HomeDashboardCard.jsx` — pending line-by-line review
- [x] `src/components/quiz/QuizAnswerLoader.jsx` — reviewed; SVG animation and runtime status colors retained because they are intrinsic to the feedback indicator.
- [ ] `src/components/quiz/QuizChallenges.jsx` — pending line-by-line review
- [ ] `src/components/quiz/QuizDashboard.jsx` — pending line-by-line review
- [ ] `src/components/quiz/QuizHero.jsx` — pending line-by-line review
- [ ] `src/components/quiz/QuizLearningPath.jsx` — pending line-by-line review
- [x] `src/components/quiz/QuizQuestionRenderer.jsx` — reviewed end-to-end; question, option, label, field, mark-for-review, and feedback states now use central contracts across all question types.
- [ ] `src/components/quiz/QuizWeakAreas.jsx` — pending line-by-line review
- [ ] `src/components/recall/RecallAnalyticsHub.jsx` — pending line-by-line review
- [ ] `src/components/recall/RecallInsightsTab.jsx` — pending line-by-line review
- [ ] `src/components/recall/RecallLeaderboardTab.jsx` — pending line-by-line review
- [ ] `src/components/recall/RecallProgressTab.jsx` — pending line-by-line review
- [ ] `src/components/ui/AnimatedJoinButton.jsx` — pending line-by-line review
- [ ] `src/components/ui/DownloadButton.jsx` — pending line-by-line review
- [ ] `src/components/ui/PremiumAccessButton.jsx` — pending line-by-line review
- [ ] `src/components/ui/empty-utils.js` — pending line-by-line review
- [ ] `src/components/ui/empty.jsx` — pending line-by-line review
- [ ] `src/components/ui/empty8.jsx` — pending line-by-line review
- [ ] `src/components/ui/liquid-glass-card.jsx` — pending line-by-line review
- [ ] `src/components/ui/marquee-card.jsx` — pending line-by-line review
- [ ] `src/components/ui/marquee.jsx` — pending line-by-line review
- [ ] `src/components/ui/sign-in-page.jsx` — pending line-by-line review

### Feature modules (30 files)

- [x] `src/features/Notes/NotesSection.jsx` — reviewed end-to-end; removed redundant section/topic card wrappers, retained individual note resource tiles, and reused the shared reading-content contract.
- [ ] `src/features/chat/AIAssistant.jsx` — pending line-by-line review
- [ ] `src/features/chat/ChatWidget.jsx` — pending line-by-line review
- [ ] `src/features/classroom/ClassroomOnboarding.jsx` — pending line-by-line review
- [ ] `src/features/classroom/ClassroomSection.jsx` — pending line-by-line review
- [ ] `src/features/classroom/ClassroomTeaser.jsx` — pending line-by-line review
- [ ] `src/features/classroom/CollaborativeWhiteboard.jsx` — pending line-by-line review
- [ ] `src/features/community/CommunitySection.jsx` — pending line-by-line review
- [ ] `src/features/contact/ContactSection.jsx` — pending line-by-line review
- [ ] `src/features/flashcards/FlashcardSection.jsx` — pending line-by-line review
- [ ] `src/features/home/BlogGrid.jsx` — pending line-by-line review
- [ ] `src/features/home/EducationalShowcase.jsx` — pending line-by-line review
- [ ] `src/features/home/FaqAccordion.jsx` — pending line-by-line review
- [ ] `src/features/home/HomeView.jsx` — pending line-by-line review
- [ ] `src/features/home/LernwickHomeHero.jsx` — pending line-by-line review
- [ ] `src/features/home/LernwickHomeSections.jsx` — pending line-by-line review
- [ ] `src/features/home/NewsletterForm.jsx` — pending line-by-line review
- [ ] `src/features/home/PricingCards.jsx` — pending line-by-line review
- [ ] `src/features/home/SectionTeaser.jsx` — pending line-by-line review
- [ ] `src/features/home/StatsGrid.jsx` — pending line-by-line review
- [ ] `src/features/home/TeamScroll.jsx` — pending line-by-line review
- [ ] `src/features/home/TestimonialSlider.jsx` — pending line-by-line review
- [ ] `src/features/mood/MoodCheckSection.jsx` — pending line-by-line review
- [ ] `src/features/pdfs/PdfLibrarySection.jsx` — pending line-by-line review
- [ ] `src/features/pdfs/PdfPreviewModal.jsx` — pending line-by-line review
- [ ] `src/features/resources/ResourceIllustration.jsx` — pending line-by-line review
- [ ] `src/features/resources/ResourcesView.jsx` — pending line-by-line review
- [ ] `src/features/tutor-marketplace/TutorCard.jsx` — pending line-by-line review
- [ ] `src/features/tutor-marketplace/TutorMarketplaceSection.jsx` — pending line-by-line review
- [ ] `src/features/tutor-marketplace/TutorMarketplaceTeaser.jsx` — pending line-by-line review

### Application, data, context, hooks and utilities (34 files)

- [ ] `src/App.jsx` — pending line-by-line review
- [ ] `src/api/cachedClient.js` — pending line-by-line review
- [ ] `src/api/client.js` — pending line-by-line review
- [ ] `src/api/curriculumNavigation.js` — pending line-by-line review
- [ ] `src/api/sections.js` — pending line-by-line review
- [ ] `src/contexts/AuthContext.jsx` — pending line-by-line review
- [ ] `src/contexts/ChatContext.jsx` — pending line-by-line review
- [ ] `src/contexts/I18nContext.jsx` — pending line-by-line review
- [ ] `src/contexts/LayoutContext.jsx` — pending line-by-line review
- [ ] `src/contexts/NotificationContext.jsx` — pending line-by-line review
- [ ] `src/contexts/ThemeContext.jsx` — pending line-by-line review
- [ ] `src/hooks/useContentAccess.js` — pending line-by-line review
- [ ] `src/hooks/useLevelFilter.js` — pending line-by-line review
- [ ] `src/hooks/useNetworkStatus.js` — pending line-by-line review
- [ ] `src/hooks/useRequireOnboarding.js` — pending line-by-line review
- [ ] `src/hooks/useSecurityUiLock.js` — pending line-by-line review
- [ ] `src/i18n/locales.js` — pending line-by-line review
- [ ] `src/lib/passkeyClient.js` — pending line-by-line review
- [ ] `src/main.jsx` — pending line-by-line review
- [ ] `src/utils/cache.js` — pending line-by-line review
- [ ] `src/utils/challengeConfig.js` — pending line-by-line review
- [ ] `src/utils/donationFormatting.js` — pending line-by-line review
- [ ] `src/utils/faqData.js` — pending line-by-line review
- [ ] `src/utils/highlightBiologyTerms.js` — pending line-by-line review
- [ ] `src/utils/learningDataCache.js` — pending line-by-line review
- [ ] `src/utils/learningJourney.js` — pending line-by-line review
- [ ] `src/utils/noteReading.js` — pending line-by-line review
- [ ] `src/utils/notesPage.js` — pending line-by-line review
- [ ] `src/utils/prefetchLearningPages.js` — pending line-by-line review
- [ ] `src/utils/quizRuntime.js` — pending line-by-line review
- [ ] `src/utils/runtimeErrors.js` — pending line-by-line review
- [ ] `src/utils/scrollReveal.js` — pending line-by-line review
- [ ] `src/utils/subscriptionNavigation.js` — pending line-by-line review
- [ ] `src/utils/uiPreferences.js` — pending line-by-line review

