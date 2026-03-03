import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import About from './pages/About';
import StudentDashboard from './pages/student/Dashboard';
import Courses from './pages/student/Courses';
import CourseDetail from './pages/student/CourseDetail';
import QuizAttempt from './pages/student/QuizAttempt';
import PracticeQuiz from './pages/student/PracticeQuiz';
import StudyPlan from './pages/student/StudyPlan';
import TeacherDashboard from './pages/teacher/Dashboard';
import ManageCourse from './pages/teacher/ManageCourse';
import CreateQuiz from './pages/teacher/CreateQuiz';
import UploadMaterial from './pages/teacher/UploadMaterial';
import StudentAnalytics from './pages/teacher/StudentAnalytics';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to={'/' + user.role + '/dashboard'} />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={'/' + user.role + '/dashboard'} />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            <Navigate to={'/' + user.role + '/dashboard'} />
          ) : (
            <Register />
          )
        }
      />
      <Route path="/about" element={<About />} />

      {/* Protected pages inside layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <CourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quiz/:id"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <QuizAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:courseId/practice"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <PracticeQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/study-plan"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudyPlan />
            </ProtectedRoute>
          }
        />

        {/* Teacher routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/new"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <ManageCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/materials"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <UploadMaterial />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/courses/:courseId/quizzes"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <CreateQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <StudentAnalytics />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Shared */}
        <Route path="/profile" element={<Profile />} />
      </Route>


      {/* Catch-all */}
      <Route
        path="*"
        element={
          <Navigate to={user ? '/' + user.role + '/dashboard' : '/'} />
        }
      />
    </Routes>
  );
}