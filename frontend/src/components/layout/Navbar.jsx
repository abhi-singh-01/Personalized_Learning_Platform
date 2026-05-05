import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  Sun, Moon, LogOut, User, GraduationCap, Bell, BookOpen, Brain,
  LayoutDashboard, PlusCircle, Users, ChevronDown, AlertTriangle, X, Menu, TicketPercent
} from 'lucide-react';
import { getInitials } from '../../utils/helpers';

const learnerQuickLinks = [
  { to: '/learner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/learner/courses', label: 'Courses', icon: BookOpen },
  { to: '/learner/study-plan', label: 'AI Study Plan', icon: Brain },
];
const educatorQuickLinks = [
  { to: '/educator/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/educator/courses', label: 'Manage Courses', icon: PlusCircle },
  { to: '/educator/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/educator/learners', label: 'Learners', icon: Users },
];
const adminQuickLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/offers', label: 'Offers', icon: TicketPercent },
];

export default function Navbar() {
  const { user, logout, sessionWarning, extendSession } = useAuth();
  const { dark, toggle } = useTheme();
  const toast = useToast();
  const nav = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const profileRef = useRef(null);

  const isEducator = user?.role === 'educator';
  const links = isEducator
    ? educatorQuickLinks
    : user?.role === 'admin'
      ? adminQuickLinks
      : learnerQuickLinks;
  const roleName = user?.role === 'admin' ? 'Admin' : (isEducator ? 'Educator' : 'Learner');

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Session Warning Banner */}
      {sessionWarning && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-lg">
          <AlertTriangle size={16} />
          <span>Your session will expire soon due to inactivity</span>
          <button
            onClick={() => { extendSession(); toast.info('Session extended'); }}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
          >
            Stay logged in
          </button>
        </div>
      )}

      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="h-16 px-4 lg:px-6 flex items-center justify-between gap-4 overflow-visible">
          {/* Left: Logo + Brand */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
                PLP
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 font-medium">
                LEARNING PLATFORM
              </span>
            </div>
          </Link>

          {/* Center: Quick Nav Links (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const isActive = location.pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <l.icon size={16} />
                  <span className="hidden lg:inline">{l.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Role badge */}
            <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
              {roleName}
            </span>

            {/* Theme toggle */}
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-md">
                  {getInitials(user?.name)}
                </div>
                <ChevronDown size={14} className={`hidden sm:block text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 animate-fade-in-up z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    <span className="inline-flex mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
                      {roleName}
                    </span>
                  </div>

                  {/* Quick links in dropdown for mobile */}
                  <div className="md:hidden py-1 border-b border-gray-100 dark:border-gray-700">
                    {links.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <l.icon size={16} />
                        {l.label}
                      </Link>
                    ))}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <User size={16} />
                    Profile Settings
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <GraduationCap size={16} />
                      Admin Dashboard
                    </Link>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                    <button
                      onClick={async () => {
                        await logout();
                        toast.success('Signed out successfully');
                        setProfileOpen(false);
                        nav('/login', { replace: true });
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger for nav links */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
            <div className="space-y-1">
              {links.map((l) => {
                const isActive = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <l.icon size={18} />
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}