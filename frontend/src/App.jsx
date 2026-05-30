import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/auth/ErrorBoundary';
import ApiConfigWarning from './components/ui/ApiConfigWarning';
import { roleHomeSegment, isLearnerRole, isEducatorLoginRoute, adminDashboardPath } from './utils/rolePaths';

// ── Only the shell loads eagerly — everything else is lazy ──
const AppLayout = lazy(() => import('./components/layout/AppLayout'));
const AIChatBot = lazy(() => import('./components/ui/AIChatBot'));

// ── Public pages ──
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const CompleteProfile = lazy(() => import('./pages/auth/CompleteProfile'));
const About = lazy(() => import('./pages/About'));
const Features = lazy(() => import('./pages/Features'));
const Tracks = lazy(() => import('./pages/Tracks'));
const Insights = lazy(() => import('./pages/Insights'));
const BecomeEducator = lazy(() => import('./pages/BecomeEducator'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ── Learner pages ──
const LearnerDashboard = lazy(() => import('./pages/learner/Dashboard'));
const LearnerMyCourses = lazy(() => import('./pages/learner/MyCourses'));
const Courses = lazy(() => import('./pages/learner/Courses'));
const CourseDetail = lazy(() => import('./pages/learner/CourseDetail'));
const QuizAttempt = lazy(() => import('./pages/learner/QuizAttempt'));
const PracticeQuiz = lazy(() => import('./pages/learner/PracticeQuiz'));
const StudyPlan = lazy(() => import('./pages/learner/StudyPlan'));
const LiveClassRoom = lazy(() => import('./pages/learner/LiveClassRoom'));
const PaymentHistory = lazy(() => import('./pages/learner/PaymentHistory'));

// ── Educator pages ──
const EducatorDashboard = lazy(() => import('./pages/educator/Dashboard'));
const MyCourses = lazy(() => import('./pages/educator/MyCourses'));
const ManageCourse = lazy(() => import('./pages/educator/ManageCourse'));
const CreateQuiz = lazy(() => import('./pages/educator/CreateQuiz'));
const UploadMaterial = lazy(() => import('./pages/educator/UploadMaterial'));
const LearnerAnalytics = lazy(() => import('./pages/educator/LearnerAnalytics'));
const LiveLecture = lazy(() => import('./pages/educator/LiveLecture'));
const EducatorCoupons = lazy(() => import('./pages/educator/Coupons'));
const LiveClassManager = lazy(() => import('./pages/educator/LiveClassManager'));
const EducatorLiveClassHost = lazy(() => import('./pages/educator/EducatorLiveClassHost'));
const EarningsDashboard = lazy(() => import('./pages/educator/EarningsDashboard'));
const CourseReviews = lazy(() => import('./pages/educator/CourseReviews'));

// ── Admin pages ──
const AdminLogin = lazy(() => import('./pages/auth/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const LiveClassMonitor = lazy(() => import('./pages/admin/LiveClassMonitor'));
const ContentModeration = lazy(() => import('./pages/admin/ContentModeration'));
const UIConfigManager = lazy(() => import('./pages/admin/UIConfigManager'));
const PaymentSupport = lazy(() => import('./pages/admin/PaymentSupport'));

// ── Shared ──
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));

// ── Full-page loading skeleton ──
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-[#0A0A0A]">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-900 rounded-full" />
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-sm text-gray-400 font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

// ── Inline route-level loader (smaller, for in-page transitions) ──
const RouteLoader = () => (
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

  // Logged-in users hitting /login — send each role to the correct home (never educator login → admin via wrong portal)
  const LoginRedirect = () => {
    const params = new URLSearchParams(window.location.search);
    const educatorLogin = isEducatorLoginRoute(window.location.pathname, params);
    if (user?.role === 'admin') {
      return <Navigate to={adminDashboardPath()} replace />;
    }
    if (educatorLogin && isLearnerRole(user?.role)) {
      return <Navigate to="/become-educator" replace />;
    }
    return <Navigate to={`/${roleHomeSegment(user.role)}/dashboard`} replace />;
  };

  const loginRouteElement = (
    !loading && user ? <LoginRedirect /> : <Login />
  );

  return (
    <ErrorBoundary>
    <ApiConfigWarning />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={loginRouteElement} />
        <Route path="/educator/login" element={loginRouteElement} />
        <Route
          path="/register"
          element={
            !loading && user ? (
              <Navigate to={`/${roleHomeSegment(user.role)}/dashboard`} replace />
            ) : (
              <Register />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/features" element={<Features />} />
        <Route path="/tracks" element={<Tracks />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/become-educator" element={<BecomeEducator />} />
        <Route
          path="/admin/login"
          element={
            !loading && user && user.role === 'admin'
              ? <Navigate to={adminDashboardPath()} replace />
              : <AdminLogin />
          }
        />
        <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />

        {/* Full-screen live meeting (no sidebar — Meet-style) */}
        <Route path="/learner/live-class/:classId" element={<ProtectedRoute allowedRoles={['learner']}><Suspense fallback={<RouteLoader />}><LiveClassRoom /></Suspense></ProtectedRoute>} />
        <Route path="/educator/live-class/:classId" element={<ProtectedRoute allowedRoles={['educator']}><Suspense fallback={<RouteLoader />}><EducatorLiveClassHost /></Suspense></ProtectedRoute>} />

        {/* Protected pages inside layout */}
        <Route element={<ProtectedRoute><Suspense fallback={<RouteLoader />}><AppLayout /></Suspense></ProtectedRoute>}>
          {/* Learner routes */}
          <Route path="/learner/dashboard" element={<ProtectedRoute allowedRoles={['learner']}><LearnerDashboard /></ProtectedRoute>} />
          <Route path="/learner/my-courses" element={<ProtectedRoute allowedRoles={['learner']}><LearnerMyCourses /></ProtectedRoute>} />
          <Route path="/learner/courses" element={<ProtectedRoute allowedRoles={['learner']}><Courses /></ProtectedRoute>} />
          <Route path="/learner/courses/:id" element={<ProtectedRoute allowedRoles={['learner']}><CourseDetail /></ProtectedRoute>} />
          <Route path="/learner/quiz/:id" element={<ProtectedRoute allowedRoles={['learner']}><QuizAttempt /></ProtectedRoute>} />
          <Route path="/learner/courses/:courseId/practice" element={<ProtectedRoute allowedRoles={['learner']}><PracticeQuiz /></ProtectedRoute>} />
          <Route path="/learner/study-plan" element={<ProtectedRoute allowedRoles={['learner']}><StudyPlan /></ProtectedRoute>} />
          <Route path="/learner/payments" element={<ProtectedRoute allowedRoles={['learner']}><PaymentHistory /></ProtectedRoute>} />

          {/* Educator routes */}
          <Route path="/educator/dashboard" element={<ProtectedRoute allowedRoles={['educator']}><EducatorDashboard /></ProtectedRoute>} />
          <Route path="/educator/courses" element={<ProtectedRoute allowedRoles={['educator']}><MyCourses /></ProtectedRoute>} />
          <Route path="/educator/courses/new" element={<ProtectedRoute allowedRoles={['educator']}><ManageCourse /></ProtectedRoute>} />
          <Route path="/educator/courses/:id/edit" element={<ProtectedRoute allowedRoles={['educator']}><ManageCourse /></ProtectedRoute>} />
          <Route path="/educator/courses/:courseId/materials" element={<ProtectedRoute allowedRoles={['educator']}><UploadMaterial /></ProtectedRoute>} />
          <Route path="/educator/courses/:courseId/quizzes" element={<ProtectedRoute allowedRoles={['educator']}><CreateQuiz /></ProtectedRoute>} />
          <Route path="/educator/courses/:courseId/reviews" element={<ProtectedRoute allowedRoles={['educator']}><CourseReviews /></ProtectedRoute>} />
          <Route path="/educator/learners" element={<ProtectedRoute allowedRoles={['educator']}><LearnerAnalytics /></ProtectedRoute>} />
          <Route path="/educator/courses/:courseId/live" element={<ProtectedRoute allowedRoles={['educator']}><LiveLecture /></ProtectedRoute>} />
          <Route path="/educator/coupons" element={<ProtectedRoute allowedRoles={['educator']}><EducatorCoupons /></ProtectedRoute>} />
          <Route path="/educator/live-classes" element={<ProtectedRoute allowedRoles={['educator']}><LiveClassManager /></ProtectedRoute>} />
          <Route path="/educator/earnings" element={<ProtectedRoute allowedRoles={['educator']}><EarningsDashboard /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/live-monitor" element={<ProtectedRoute allowedRoles={['admin']}><LiveClassMonitor /></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute allowedRoles={['admin']}><ContentModeration /></ProtectedRoute>} />
          <Route path="/admin/ui-config" element={<ProtectedRoute allowedRoles={['admin']}><UIConfigManager /></ProtectedRoute>} />
          <Route path="/admin/payment-support" element={<ProtectedRoute allowedRoles={['admin']}><PaymentSupport /></ProtectedRoute>} />
          {/* Legacy admin URLs → dashboard */}
          <Route path="/admin/analytics" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/offers" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/feature-flags" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/audit-logs" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Shared */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 404 — proper page instead of silent redirect */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
    <Suspense fallback={null}>
      <AIChatBot />
    </Suspense>
    </ErrorBoundary>
  );
}