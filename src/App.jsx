 import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect } from 'react';
import { ProtectedRoute, useAuth } from './contexts/AuthContext';
import { LayoutProvider, useLayout } from './contexts/LayoutContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './components/Toast/Toast';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import PageSkeleton from './components/Loading/PageSkeleton';
import Seo from './components/Seo/Seo';
import { trackPageView } from './api/client';

function lazyLoad(factory) {
  return lazy(() => {
    const load = () =>
      factory().then((mod) => {
        if (!mod || !mod.default) throw new Error('Chunk failed to load');
        return mod;
      });
    return load().catch(
      () => new Promise((resolve) => setTimeout(resolve, 800)).then(load)
    );
  });
}

const Home = lazyLoad(() => import('./pages/Home'));
const AIAssistant = lazyLoad(() => import('./features/chat/AIAssistant'));
const Dashboard = lazyLoad(() => import('./pages/Dashboard'));
const Profile = lazyLoad(() => import('./pages/Profile'));
const Quiz = lazyLoad(() => import('./pages/Quiz'));
const QuestionBankPage = lazyLoad(() => import('./pages/QuestionBankPage'));
const ClinicalSimulationsPage = lazyLoad(() => import('./pages/ClinicalSimulationsPage'));
const QuizReview = lazyLoad(() => import('./pages/QuizReview'));
const QuizAttemptResult = lazyLoad(() => import('./pages/QuizAttemptResult'));
const Challenges = lazyLoad(() => import('./pages/Challenges'));
const ChallengeRunner = lazyLoad(() => import('./pages/ChallengeRunner'));
const QuizChallengePage = lazyLoad(() => import('./pages/challenges/QuizChallengePage'));
const FlashcardsPage = lazyLoad(() => import('./pages/FlashcardsPage'));
const Classroom = lazyLoad(() => import('./pages/Classroom'));
const ClassroomRoom = lazyLoad(() => import('./pages/ClassroomRoom'));
const PastPapers = lazyLoad(() => import('./pages/PastPapers'));
const NoteDetail = lazyLoad(() => import('./pages/NoteDetail'));
const NoteLearningExplanation = lazyLoad(() => import('./pages/NoteLearningExplanation'));
const NotesPage = lazyLoad(() => import('./pages/NotesPage'));
const PdfLibraryPage = lazyLoad(() => import('./pages/PdfLibraryPage'));
const Glossary = lazyLoad(() => import('./pages/Glossary'));
const Recall = lazyLoad(() => import('./pages/Recall'));
const AboutPage = lazyLoad(() => import('./pages/AboutPage'));
const LegalPage = lazyLoad(() => import('./pages/LegalPage'));
const Auth = lazyLoad(() => import('./pages/Auth'));
const TutorApply = lazyLoad(() => import('./pages/TutorApply'));
const TutorDashboard = lazyLoad(() => import('./pages/TutorDashboard'));
const TutorMarketplace = lazyLoad(() => import('./pages/TutorMarketplace'));
const TutorProfile = lazyLoad(() => import('./pages/TutorProfile'));
const FaqPage = lazyLoad(() => import('./pages/FaqPage'));
const BlogPage = lazyLoad(() => import('./pages/BlogPage'));
const ContactPage = lazyLoad(() => import('./pages/ContactPage'));
const CommunityPage = lazyLoad(() => import('./pages/CommunityPage'));
const Resources = lazyLoad(() => import('./pages/Resources'));
const Advertise = lazyLoad(() => import('./pages/Advertise'));
const AdvertiseCreate = lazyLoad(() => import('./pages/AdvertiseCreate'));
const AdvertisePayment = lazyLoad(() => import('./pages/AdvertisePayment'));
const CurriculumNodePage = lazyLoad(() => import('./pages/CurriculumNodePage'));
const Donate = lazyLoad(() => import('./pages/Donate'));
import CookieConsent from './components/CookieConsent/CookieConsent';
import MaintenanceGate, { MaintenanceBoundary } from './components/Maintenance/MaintenanceGate';

const NotFoundPage = lazyLoad(() => import('./components/NotFoundPage'));

function FeatureRoute({ feature, children }) {
  const { features } = useLayout();
  const enabled = features[feature] ?? true;

  if (!enabled) {
    return (
      <section className="flex min-h-[60vh] w-full items-center justify-center bg-primary-50 px-4 py-12">
        <div className="grid w-full max-w-xl justify-items-center gap-4 rounded-2xl border border-border bg-white p-7 text-center shadow-sm sm:p-9">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-800"><i className="fa-solid fa-lock text-2xl" aria-hidden="true" /></span>
          <h2 className="text-2xl font-extrabold text-primary-900">Feature Unavailable</h2>
          <p className="text-sm leading-7 text-muted">This feature is not currently available for your level. Please check back later.</p>
        </div>
      </section>
    );
  }

  return <MaintenanceBoundary boundaryKey={feature}>{children}</MaintenanceBoundary>;
}


function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();
  const [assistantReady, setAssistantReady] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    trackPageView(location.pathname).catch(() => {});
  }, [location.pathname, user?.id]);

  useEffect(() => {
    if (!user?.id) setAssistantReady(false);
  }, [user?.id]);
  return (
    <>
      <Seo />
      <Layout>
        <Suspense fallback={<PageSkeleton />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />

            <Route
              path="/advertise"
              element={<Advertise />}
            />

            <Route
              path="/advertise/create"
              element={
                <ProtectedRoute>
                  <AdvertiseCreate />
                </ProtectedRoute>
              }
            />

            <Route
              path="/advertise/payment"
              element={
                <ProtectedRoute>
                  <AdvertisePayment />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/curriculum/:groupId/*" element={<ProtectedRoute><CurriculumNodePage /></ProtectedRoute>} />
            <Route path="/question-bank" element={<ProtectedRoute><FeatureRoute feature="quizzes"><QuestionBankPage /></FeatureRoute></ProtectedRoute>} />
            <Route path="/clinical-simulations" element={<ProtectedRoute><ClinicalSimulationsPage /></ProtectedRoute>} />
            <Route path="/clinical-simulations/:caseId" element={<ProtectedRoute><ClinicalSimulationsPage /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><FeatureRoute feature="quizzes"><Quiz /></FeatureRoute></ProtectedRoute>} />
            <Route path="/quiz/blocks" element={<ProtectedRoute><FeatureRoute feature="quizzes"><Quiz /></FeatureRoute></ProtectedRoute>} />
            <Route path="/quiz/review" element={<ProtectedRoute><QuizReview /></ProtectedRoute>} />
            <Route path="/quiz/attempt/:attemptId" element={<ProtectedRoute><QuizAttemptResult /></ProtectedRoute>} />
            <Route path="/challenges" element={<ProtectedRoute><Challenges /></ProtectedRoute>} />
            <Route path="/challenges/recall" element={<ProtectedRoute><FeatureRoute feature="recall"><ChallengeRunner forcedType="recall" /></FeatureRoute></ProtectedRoute>} />
            <Route path="/challenges/flashcards" element={<ProtectedRoute><FeatureRoute feature="flashcards"><ChallengeRunner forcedType="flashcards" /></FeatureRoute></ProtectedRoute>} />
            <Route path="/challenges/quiz" element={<ProtectedRoute><FeatureRoute feature="quizzes"><QuizChallengePage /></FeatureRoute></ProtectedRoute>} />
            <Route path="/recall" element={<ProtectedRoute><FeatureRoute feature="recall"><Recall /></FeatureRoute></ProtectedRoute>} />
            <Route path="/flashcards" element={<ProtectedRoute><FeatureRoute feature="flashcards"><FlashcardsPage /></FeatureRoute></ProtectedRoute>} />
            <Route path="/classroom" element={<ProtectedRoute><FeatureRoute feature="classrooms"><Classroom /></FeatureRoute></ProtectedRoute>} />
            <Route path="/classroom/:roomId" element={<ProtectedRoute><FeatureRoute feature="classrooms"><ClassroomRoom /></FeatureRoute></ProtectedRoute>} />
            <Route path="/past-papers" element={<FeatureRoute feature="past_papers"><PastPapers /></FeatureRoute>} />
            <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
            <Route path="/notes/read" element={<ProtectedRoute><NoteDetail key={location.search} /></ProtectedRoute>} />
            <Route path="/learning/explanation" element={<ProtectedRoute><NoteLearningExplanation key={location.search} /></ProtectedRoute>} />
            <Route path="/pdfs" element={<ProtectedRoute><PdfLibraryPage /></ProtectedRoute>} />
            <Route path="/glossary/:slug" element={<ProtectedRoute><FeatureRoute feature="glossary"><Glossary /></FeatureRoute></ProtectedRoute>} />
            <Route path="/glossary" element={<ProtectedRoute><FeatureRoute feature="glossary"><Glossary /></FeatureRoute></ProtectedRoute>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
            <Route path="/tutor/apply" element={<ProtectedRoute><TutorApply /></ProtectedRoute>} />
            <Route path="/tutor/dashboard" element={<ProtectedRoute><TutorDashboard /></ProtectedRoute>} />
            <Route path="/tutors" element={<TutorMarketplace />} />
            <Route path="/tutor/:profileId" element={<TutorProfile />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <CookieConsent />
        <MaintenanceGate />
      </Layout>
      {user?.id && !assistantReady && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <button
            type="button"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary-600 bg-primary-800 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-primary-900/20 transition hover:-translate-y-0.5 hover:bg-primary-900"
            onClick={() => setAssistantReady(true)}
            aria-label="Open AliverBiopharm AI Tutor"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4a3 3 0 0 0-5.7 1.2A3.5 3.5 0 0 0 5 11.5a3.5 3.5 0 0 0 2.5 6A3 3 0 0 0 12 20V4Zm0 0a3 3 0 0 1 5.7 1.2A3.5 3.5 0 0 1 19 11.5a3.5 3.5 0 0 1-2.5 6A3 3 0 0 0 12 20" />
                <path d="M8 8h2m4 0h2M7 13h3m4 0h3M9 17h2m2-9v3m0 4v2" />
              </svg>
            </span>
            <span>AI Tutor</span>
          </button>
        </div>
      )}
      {assistantReady && <Suspense fallback={null}><AIAssistant initialOpen /></Suspense>}
    </>
  );
}

export default function App() {
  return (
    <LayoutProvider>
        <ChatProvider>
          <ToastProvider>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
          </ToastProvider>
        </ChatProvider>
      </LayoutProvider>
  );
}
