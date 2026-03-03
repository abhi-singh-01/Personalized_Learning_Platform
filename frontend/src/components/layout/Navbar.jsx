import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, LogOut, User, GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { getInitials } from '../../utils/helpers';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
        <GraduationCap size={28} /> Personalized Learning Platform
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/about" className="text-sm font-medium hover:text-primary-600 transition-colors">About</Link>
        <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300">
              {getInitials(user?.name)}
            </div>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 animate-in fade-in">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"><User size={16} /> Profile</Link>
              {user?.role === 'admin' && (
                <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  <GraduationCap size={16} /> Admin Dashboard
                </Link>
              )}
              <button onClick={() => { logout(); setOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut size={16} /> Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}