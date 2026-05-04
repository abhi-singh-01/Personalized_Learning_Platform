import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  GraduationCap, Sun, Moon, LogIn, Search, Menu, X,
  ChevronDown, UserCircle2, BookOpen, Compass, Lightbulb,
  Code, Database, Briefcase, Brain, BarChart3, Layers,
} from 'lucide-react';

const categories = [
  { label: 'Data & AI', icon: Brain, color: 'text-blue-500', href: '/tracks' },
  { label: 'Web Development', icon: Code, color: 'text-emerald-500', href: '/tracks' },
  { label: 'System Design', icon: Layers, color: 'text-purple-500', href: '/tracks' },
  { label: 'Career Prep', icon: Briefcase, color: 'text-amber-500', href: '/tracks' },
  { label: 'Analytics', icon: BarChart3, color: 'text-rose-500', href: '/tracks' },
  { label: 'Databases', icon: Database, color: 'text-cyan-500', href: '/tracks' },
];

/* ── Live search ── */
function NavSearch({ className = '', onNavigate, heroMode = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch('/api/courses/public?search=' + encodeURIComponent(query.trim()));
        const j = await r.json();
        setResults(j.data || []);
        setShow(true);
      } catch { setResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer.current);
  }, [query]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${
        heroMode
          ? 'border border-white/15 bg-white/[0.07] focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/20'
          : 'border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80 focus-within:border-purple-400 dark:focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 dark:focus-within:ring-purple-900/30'
      }`}>
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search for anything"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShow(true); }}
          onFocus={() => results.length > 0 && setShow(true)}
          className={`flex-1 bg-transparent border-none outline-none text-sm min-w-0 ${
            heroMode
              ? 'text-white placeholder:text-gray-400'
              : 'text-gray-800 dark:text-gray-100 placeholder:text-gray-400'
          }`}
        />
        {searching && <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />}
      </div>
      {show && query.trim().length >= 2 && (
        <div className="absolute z-[60] w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {results.length === 0 && !searching && (
            <div className="p-4 text-center text-sm text-gray-500">No courses found for "{query}"</div>
          )}
          {results.map((c) => (
            <button
              key={c._id}
              onClick={() => { setShow(false); setQuery(''); onNavigate?.(); navigate(user ? '/learner/courses/' + c._id : '/login'); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                <p className="text-xs text-gray-400 truncate">{c.category} · {c.educator?.name || 'Educator'}</p>
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
  const role = user?.role;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const exploreRef = useRef(null);
  const exploreTimer = useRef(null);

  const isActive = (p) => location.pathname === p;
  const closeMobile = () => setMobileOpen(false);

  const navLink = (to, label) => (
    <Link to={to} className={`text-sm font-medium transition-colors hover:text-white ${
      isHeroPage
        ? (isActive(to) ? 'text-white' : 'text-gray-300')
        : (isActive(to) ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400')
    }`}>
      {label}
    </Link>
  );

  // Pages with dark hero backgrounds where navbar should blend seamlessly
  const isHeroPage = ['/become-educator', '/'].includes(location.pathname);

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-xl transition-colors duration-300 ${
      isHeroPage
        ? 'bg-gray-950/80 border-b border-white/[0.06]'
        : 'bg-white/95 dark:bg-gray-950/95 border-b border-gray-200/80 dark:border-gray-800/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
            <GraduationCap size={20} className="text-white" />
          </div>
          <span className={`text-lg font-bold tracking-tight hidden sm:block ${isHeroPage ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
            LearnAI
          </span>
        </Link>

        {/* Explore Dropdown (desktop) */}
        <div
          className="hidden lg:block relative"
          ref={exploreRef}
          onMouseEnter={() => { clearTimeout(exploreTimer.current); setExploreOpen(true); }}
          onMouseLeave={() => { exploreTimer.current = setTimeout(() => setExploreOpen(false), 200); }}
        >
          <button className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition-all ${
            isHeroPage
              ? 'text-gray-200 hover:text-white hover:bg-white/10'
              : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}>
            <Compass size={16} /> Explore <ChevronDown size={14} className={`transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
          </button>
          {exploreOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-3 animate-fade-in-up">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-2">Categories</p>
              {categories.map((cat) => (
                <Link key={cat.label} to={cat.href} onClick={() => setExploreOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item">
                  <cat.icon size={18} className={cat.color} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover/item:text-gray-900 dark:group-hover/item:text-white">{cat.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Nav Links (desktop) */}
        <div className="hidden lg:flex items-center gap-5">
          {navLink('/features', 'Features')}
          {navLink('/insights', 'AI Insights')}
          {user && navLink(`/${role}/courses`, 'My Learning')}
        </div>

        {/* Search (desktop) */}
        <NavSearch className="hidden lg:block flex-1 max-w-sm" heroMode={isHeroPage} />

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Become Educator CTA */}
          {(!user || user.role === 'learner') && (
            <Link to="/become-educator" className={`hidden xl:inline-flex text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
              isHeroPage
                ? 'text-purple-300 border border-purple-500/40 hover:bg-purple-500/10'
                : 'text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/30'
            }`}>
              Become an Educator
            </Link>
          )}

          {/* Theme toggle */}
          <button onClick={toggle} className={`p-2 rounded-full transition-all ${isHeroPage ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`} aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <Link to={`/${role}/dashboard`}
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 px-4 py-2 rounded-full shadow-md shadow-purple-500/25 hover:shadow-lg transition-all">
              <UserCircle2 size={16} /> Dashboard
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className={`text-sm font-semibold px-4 py-2 rounded-full transition-all ${isHeroPage ? 'text-gray-200 hover:text-white hover:bg-white/10' : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                Sign in
              </Link>
              <Link to="/register"
                className="text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 px-5 py-2 rounded-full shadow-md shadow-purple-500/25 hover:shadow-lg transition-all">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button className={`lg:hidden p-2 rounded-full transition-all ${isHeroPage ? 'text-gray-200 hover:bg-white/10' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`} onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
            <NavSearch onNavigate={closeMobile} />

            <div className="space-y-1">
              <button onClick={() => setExploreOpen(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
                <span className="flex items-center gap-2"><Compass size={16} /> Explore</span>
                <ChevronDown size={16} className={`transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>
              {exploreOpen && (
                <div className="ml-4 space-y-0.5 pb-2">
                  {categories.map((cat) => (
                    <Link key={cat.label} to={cat.href} onClick={closeMobile}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <cat.icon size={16} className={cat.color} /> {cat.label}
                    </Link>
                  ))}
                </div>
              )}
              <Link to="/features" onClick={closeMobile} className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">Features</Link>
              <Link to="/insights" onClick={closeMobile} className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">AI Insights</Link>
              {user && <Link to={`/${role}/courses`} onClick={closeMobile} className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">My Learning</Link>}
              {(!user || user.role === 'learner') && (
                <Link to="/become-educator" onClick={closeMobile} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20">Become an Educator</Link>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
              {user ? (
                <Link to={`/${role}/dashboard`} onClick={closeMobile}
                  className="flex-1 text-center text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 py-2.5 rounded-full shadow-md">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobile} className="flex-1 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 py-2.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800">
                    Sign in
                  </Link>
                  <Link to="/register" onClick={closeMobile}
                    className="flex-1 text-center text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 py-2.5 rounded-full shadow-md">
                    Sign up
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
