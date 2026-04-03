import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  GraduationCap,
  Sun,
  Moon,
  LogIn,
  Search,
  Menu,
  X,
  ChevronDown,
  UserCircle2,
  BookOpen,
} from 'lucide-react';

const learningTracks = [
  { label: 'Data & AI', href: '/tracks' },
  { label: 'Web Development', href: '/tracks' },
  { label: 'Career Prep', href: '/tracks' },
];

/* ── Reusable search bar with live results ── */
function NavSearch({ className = '', inputClass = '' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch('/api/courses/public?search=' + encodeURIComponent(query.trim()));
        const json = await res.json();
        setResults(json.data || []);
        setShowResults(true);
      } catch { setResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/15 via-purple-500/15 to-pink-500/15 opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className={`relative flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 px-3 py-1.5 ${inputClass}`}>
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, skills, exams"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
            onFocus={() => results.length > 0 && setShowResults(true)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
          />
          {searching && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
        </div>
      </div>

      {showResults && query.trim().length >= 2 && (
        <div className="absolute z-[60] w-full mt-1.5 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {results.length === 0 && !searching && (
            <div className="p-4 text-center text-sm text-gray-500">
              No courses found for "{query}"
            </div>
          )}
          {results.map((course) => (
            <button
              key={course._id}
              onClick={() => {
                setShowResults(false);
                setQuery('');
                if (user) navigate('/learner/courses/' + course._id);
                else navigate('/login');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{course.title}</p>
                <p className="text-xs text-gray-400 truncate">{course.category} · {course.difficulty} · {course.educator?.name || 'Educator'}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PublicNavbar() {
  const { user } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();
  const effectiveRole = user?.role;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tracksOpen, setTracksOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-[#050509]/90 backdrop-blur-2xl border-b border-gray-100/80 dark:border-gray-900/80">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo + brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">
              Personalized Learning
            </span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">
              AI CAMPUS
            </span>
          </div>
        </Link>

        {/* Center nav + search (desktop) */}
        <div className="hidden lg:flex items-center gap-6 flex-1">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em]">
            <span className="w-1 h-1 rounded-full bg-blue-500" />
            <span>LEARN</span>
            <span className="w-1 h-1 rounded-full bg-purple-500" />
            <span>BUILD</span>
            <span className="w-1 h-1 rounded-full bg-pink-500" />
            <span>GROW</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors"
              onMouseEnter={() => setTracksOpen(true)}
              onMouseLeave={() => setTracksOpen(false)}
            >
              <span>Explore tracks</span>
              <ChevronDown size={16} />
              {tracksOpen && (
                <div className="absolute top-8 left-0 w-72 rounded-xl bg-white dark:bg-[#050509] border border-gray-100 dark:border-gray-800 shadow-xl py-3 px-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.18em] mb-2 px-1">
                    Recommended journeys
                  </p>
                  <ul className="space-y-1.5">
                    {learningTracks.map((track) => (
                      <li key={track.label}>
                        <Link
                          to={track.href}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900/70 transition-colors"
                        >
                          <span>{track.label}</span>
                          <span className="text-[11px] text-blue-500 dark:text-blue-400">
                            View path
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </button>

            <Link
              to="/about"
              className={`text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              How it works
            </Link>

            <Link
              to="/features"
              className={`text-sm font-medium transition-colors ${isActive('/features') ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Features
            </Link>
            <Link
              to="/insights"
              className={`text-sm font-medium transition-colors ${isActive('/insights') ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
            >
              AI insights
            </Link>
          </div>

          {/* Desktop search — now functional */}
          <NavSearch className="flex-1 max-w-md" />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="hidden sm:inline-flex p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <Link
              to={'/' + effectiveRole + '/dashboard'}
              className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-blue-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
            >
              <UserCircle2 size={16} />
              <span>Go to dashboard</span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <LogIn size={14} />
                <span>Sign in</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-1.5 rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
              >
                <span>Start free</span>
              </Link>
            </div>
          )}

          {/* Mobile theme + menu */}
          <button
            onClick={toggle}
            className="sm:hidden inline-flex p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="inline-flex lg:hidden p-2 rounded-full text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-900 transition-all"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 dark:border-gray-900 bg-white/95 dark:bg-[#050509]/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-4">
            {/* Mobile search — now functional */}
            <NavSearch />

            <div className="grid gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-100">
              <button
                type="button"
                className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => setTracksOpen((v) => !v)}
              >
                <span>Explore tracks</span>
                <ChevronDown
                  size={16}
                  className={tracksOpen ? 'rotate-180 transition-transform' : 'transition-transform'}
                />
              </button>
              {tracksOpen && (
                <div className="ml-2 space-y-1 text-[13px] text-gray-500 dark:text-gray-400">
                  {learningTracks.map((track) => (
                    <Link
                      key={track.label}
                      to={track.href}
                      className="block px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                      onClick={() => setMobileOpen(false)}
                    >
                      {track.label}
                    </Link>
                  ))}
                </div>
              )}

              <Link
                to="/about"
                className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => setMobileOpen(false)}
              >
                How it works
              </Link>
              <Link
                to="/features"
                className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => setMobileOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/insights"
                className="block px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => setMobileOpen(false)}
              >
                AI insights
              </Link>
            </div>

            <div className="pt-2 border-top border-gray-100 dark:border-gray-900 flex items-center justify-between">
              {user ? (
                <Link
                  to={'/' + effectiveRole + '/dashboard'}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-blue-50 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 rounded-full shadow-md shadow-blue-500/25"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserCircle2 size={16} />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LogIn size={14} />
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-50 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 rounded-full shadow-md shadow-blue-500/25"
                    onClick={() => setMobileOpen(false)}
                  >
                    Start free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
