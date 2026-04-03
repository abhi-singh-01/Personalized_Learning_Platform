import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ArrowLeft, GraduationCap } from 'lucide-react';

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#050509] px-6 text-center">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-[100px] animate-float-slow" />
      </div>

      <div className="relative z-10 animate-fade-in-up">
        {/* Brand */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">LearnAI</span>
        </div>

        {/* 404 */}
        <h1 className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 mb-4">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Page not found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
          Don't worry — let's get you back on track!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={user ? `/${user.role}/dashboard` : '/'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Home size={16} />
            {user ? 'Go to Dashboard' : 'Go Home'}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
