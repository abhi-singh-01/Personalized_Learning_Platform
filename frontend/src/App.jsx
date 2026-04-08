import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/auth/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CompleteProfile from './pages/auth/CompleteProfile';
import About from './pages/About';
import Features from './pages/Features';
import Tracks from './pages/Tracks';
import Insights from './pages/Insights';
import BecomeEducator from './pages/BecomeEducator';
import LearnerDashboard from './pages/learner/Dashboard';
import Courses from './pages/learner/Courses';
import CourseDetail from './pages/learner/CourseDetail';
import QuizAttempt from './pages/learner/QuizAttempt';
import PracticeQuiz from './pages/learner/PracticeQuiz';
import StudyPlan from './pages/learner/StudyPlan';
import EducatorDashboard from './pages/educator/Dashboard';
import ManageCourse from './pages/educator/ManageCourse';
import CreateQuiz from './pages/educator/CreateQuiz';
import UploadMaterial from './pages/educator/UploadMaterial';
import LearnerAnalytics from './pages/educator/LearnerAnalytics';
import LiveLecture from './pages/educator/LiveLecture';
import EducatorCoupons from './pages/educator/Coupons';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminDashboard from './pages/admin/AdminDashboard';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import OffersDashboard from './pages/admin/OffersDashboard';

// New pages — lazy loaded for code splitting
const UIConfigManager = lazy(() => import('./pages/admin/UIConfigManager'));
const FeatureFlagsManager = lazy(() => import('./pages/admin/FeatureFlagsManager'));
const LiveClassMonitor = lazy(() => import('./pages/admin/LiveClassMonitor'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const ContentModeration = lazy(() => import('./pages/admin/ContentModeration'));
const LiveClassManager = lazy(() => import('./pages/educator/LiveClassManager'));
const EarningsDashboard = lazy(() => import('./pages/educator/EarningsDashboard'));
const LiveClassRoom = lazy(() => import('./pages/learner/LiveClassRoom'));
const PaymentHistory = lazy(() => import('./pages/learner/PaymentHistory'));

import AIChatBot from './components/ui/AIChatBot';

const LazyFallback = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-primary-200 dark:border-primary-800 rounded-full" />
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-xs text-gray-400 font-medium">Loading module...</p>
    </div>
  </div>
);

export default function App() {
  const { user, loading } = useAuth();

  return (
    <ErrorBoundary>
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            !loading && user ? (
              <Navigate to={'/' + (user.role || 'learner') + '/dashboard'} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            !loading && user ? (
              <Navigate to={'/' + (user.role || 'learner') + '/dashboard'} replace />
            ) : (
              <Register />
            )
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/tracks" element={<Tracks />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/become-educator" element={<BecomeEducator />} />
        <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

        {/* Protected pages inside layout */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {/* Learner routes */}
          <Route path="/learner/dashboard" element={<ProtectedRoute allowedRoles={['learner']}><LearnerDashboard /></ProtectedRoute>} />
          <Route path="/learner/courses" element={<ProtectedRoute allowedRoles={['learner']}><Courses /></ProtectedRoute>} />
          <Route path="/learner/courses/:id" element={<ProtectedRoute allowedRoles={['learner']}><CourseDetail /></ProtectedRoute>} />
          <Route path="/learner/quiz/:id" element={<ProtectedRoute allowedRoles={['learner']}><QuizAttempt /></ProtectedRoute>} />
          <Route path="/learner/courses/:courseId/practice" element={<ProtectedRoute allowedRoles={['learner']}><PracticeQuiz /></ProtectedRoute>} />
          <Route path="/learner/study-plan" element={<ProtectedRoute allowedRoles={['learner']}><StudyPlan /></ProtectedRoute>} />
          <Route path="/learner/live-class/:classId" element={<ProtectedRoute allowedRoles={['learner']}><LiveClassRoom /></ProtectedRoute>} />
          <Route path="/learner/payments" element={<ProtectedRoute allowedRoles={['learner']}><PaymentHistory /></ProtectedRoute>} />

          {/* Educator routes */}
          <Route path="/educator/dashboard" element={<ProtectedRoute allowedRoles={['educator']}><EducatorDashboard /></ProtectedRoute>} />
          <Route path="/educator/courses/new" element={<ProtectedRoute allowedRoles={['educator']}><ManageCourse /></ProtectedRoute>} />
          <Route path="/educator/courses/:id/edit" element={<ProtectedRoute allowedRoles={['educator']}><ManageCourse /></ProtectedRoute>} />
          <Route path="/educator/courses/:courseId/materials" element={<ProtectedRoute allowedRoles={['educator']}><UploadMaterial /></ProtectedRoute>} />
          <Route path="/educator/courses/:courseId/quizzes" element={<ProtectedRoute allowedRoles={['educator']}><CreateQuiz /></ProtectedRoute>} />
          <Route path="/educator/learners" element={<ProtectedRoute allowedRoles={['educator']}><LearnerAnalytics /></ProtectedRoute>} />
          <Route path="/educator/courses/:courseId/live" element={<ProtectedRoute allowedRoles={['educator']}><LiveLecture /></ProtectedRoute>} />
          <Route path="/educator/coupons" element={<ProtectedRoute allowedRoles={['educator']}><EducatorCoupons /></ProtectedRoute>} />
          <Route path="/educator/live-classes" element={<ProtectedRoute allowedRoles={['educator']}><LiveClassManager /></ProtectedRoute>} />
          <Route path="/educator/earnings" element={<ProtectedRoute allowedRoles={['educator']}><EarningsDashboard /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><PlatformAnalytics /></ProtectedRoute>} />
          <Route path="/admin/offers" element={<ProtectedRoute allowedRoles={['admin']}><OffersDashboard /></ProtectedRoute>} />
          <Route path="/admin/ui-config" element={<ProtectedRoute allowedRoles={['admin']}><UIConfigManager /></ProtectedRoute>} />
          <Route path="/admin/feature-flags" element={<ProtectedRoute allowedRoles={['admin']}><FeatureFlagsManager /></ProtectedRoute>} />
          <Route path="/admin/live-monitor" element={<ProtectedRoute allowedRoles={['admin']}><LiveClassMonitor /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['admin']}><ContentModeration /></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 404 — proper page instead of silent redirect */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    <AIChatBot />
    </ErrorBoundary>
  );
}