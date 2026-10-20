 /* src/App.jsx */
import { Routes, Route, useLocation } from 'react-router-dom';
const NotFoundPage = lazy(() => import('./components/NotFoundPage'));
import { lazy, Suspense, useState, useEffect } from 'react';
import { ProtectedRoute } from './contexts/AuthContext';
import { LayoutProvider, useLayout } from './contexts/LayoutContext';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './components/Toast/Toast';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import Seo from './components/Seo/Seo';
const Home = lazy(() => import('./pages/Home'));
const AIAssistant = lazy(() => import('./features/chat/AIAssistant'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Challenges = lazy(() => import('./pages/Challenges'));
const ChallengeRunner = lazy(() => import('./pages/ChallengeRunner'));
const QuizChallengePage = lazy(() => import('./pages/challenges/QuizChallengePage'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const Classroom = lazy(() => import('./pages/Classroom'));
const ClassroomRoom = lazy(() => import('./pages/ClassroomRoom'));
const PastPapers = lazy(() => import('./pages/PastPapers'));
const NoteDetail = lazy(() => import('./pages/NoteDetail'));
const NoteLearningExplanation = lazy(() => import('./pages/NoteLearningExplanation'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const PdfLibraryPage = lazy(() => import('./pages/PdfLibraryPage'));
const Glossary = lazy(() => import('./pages/Glossary'));
const Recall = lazy(() => import('./pages/Recall'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const Auth = lazy(() => import('./pages/Auth'));
const TutorApply = lazy(() => import('./pages/TutorApply'));
const TutorDashboard = lazy(() => import('./pages/TutorDashboard'));
const TutorMarketplace = lazy(() => import('./pages/TutorMarketplace'));
const TutorProfile = lazy(() => import('./pages/TutorProfile'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const Resources = lazy(() => import('./pages/Resources'));
const Advertise = lazy(() => import('./pages/Advertise'));
const AdvertiseCreate = lazy(() => import('./pages/AdvertiseCreate'));
const AdvertisePayment = lazy(() => import('./pages/AdvertisePayment'));
const CurriculumNodePage = lazy(() => import('./pages/CurriculumNodePage'));
const Donate = lazy(() => import('./pages/Donate'));
import CookieConsent from './components/CookieConsent/CookieConsent';
import MaintenanceGate, { MaintenanceBoundary } from './components/Maintenance/MaintenanceGate';
import './styles/cookie-consent.css';
import './styles/maintenance.css';

function SetupRequired() {
  return (
    <div className="section setup-required-section">
      <div className="card setup-required-card">
        <h1 className="setup-required-title">Select Your Level</h1>
        <p className="setup-required-text">
          Your level is set during account creation. Please sign in with an existing account or create a new one to continue.
        </p>
        <div className="setup-required-actions">
          <a href="/register" className="btn btn-primary btn-lg btn-radius-pill">Create Account</a>
          <a href="/login" className="btn btn-secondary btn-lg btn-radius-pill">Sign In</a>
        </div>
      </div>
    </div>
  );
}

function FeatureRoute({ feature, children }) {
  const { features } = useLayout();
  const enabled = features[feature] ?? true;

  if (!enabled) {
    return (
      <div className="section feature-disabled-section">
        <div className="card feature-disabled-card">
          <h2 className="feature-disabled-title">Feature Unavailable</h2>
          <p className="feature-disabled-text">
            This feature is not currently available for your level. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return <MaintenanceBoundary boundaryKey={feature}>{children}</MaintenanceBoundary>;
}


function AppRoutes() {
  const location = useLocation();
  const { level, loading: layoutLoading } = useLayout();

  const publicPaths = [
    '/login',
    '/register',
    '/about',
    '/terms',
    '/privacy',
    '/faq',
    '/blog',
    '/contact',
    '/donate',
    '/community',
    '/advertise',
    '/',
  ];

  const isPublicPath = publicPaths.some((path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path + '/')));

  const needsSetup =
    !layoutLoading &&
    !level &&
    !publicPaths.some((path) => location.pathname.startsWith(path));

  if (needsSetup) {
    return <SetupRequired />;
  }

  return (
    <>
      <Seo />
      <Layout>
        <Suspense fallback={<div className="route-loading" role="status">Loading page…</div>}>
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
            <Route path="/quiz" element={<ProtectedRoute><FeatureRoute feature="quizzes"><Quiz /></FeatureRoute></ProtectedRoute>} />
            <Route path="/quiz/blocks" element={<ProtectedRoute><FeatureRoute feature="quizzes"><Quiz /></FeatureRoute></ProtectedRoute>} />
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
      <Suspense fallback={null}><AIAssistant /></Suspense>
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