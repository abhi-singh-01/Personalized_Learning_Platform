import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { GraduationCap, Sun, Moon } from 'lucide-react';

export default function PublicNavbar() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();

  const isHome = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <GraduationCap size={24} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            Personalized Learning Platform
          </span>
        </Link>


        <div className="flex items-center gap-6">
          <Link to="/about" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            About
          </Link>
          <button
            onClick={toggle}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="flex items-center gap-4 border-l border-gray-200 dark:border-gray-700 pl-6">
            {user ? (
              <Link to={'/' + user.role + '/dashboard'} className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-md transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
