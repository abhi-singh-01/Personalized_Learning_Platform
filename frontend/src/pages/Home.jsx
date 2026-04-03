import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import {
  GraduationCap, Brain, BarChart3, Award, LogIn, ArrowRight, Users,
  BookOpen, Cpu, Star, Sparkles, Target, Rocket, Clock, Layers,
  Compass, Play, Zap, Shield, CheckCircle2, Search,
} from 'lucide-react';

const stats = [
  { label: 'Active learners', value: '12,840+', icon: Users },
  { label: 'Guided pathways', value: '120+', icon: Layers },
  { label: 'AI study hours / day', value: '38K', icon: Cpu },
  { label: 'Avg. course rating', value: '4.9/5', icon: Star },
];

const features = [
  {
    icon: Brain,
    title: 'Adaptive AI Engine',
    desc: 'Your personal learning twin mirrors how you think, then curates content and questions at your exact level.',
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Granular skill maps, weak-spot detection, and readiness scores for exams or interviews.',
    color: 'from-purple-500 to-pink-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
  },
  {
    icon: Award,
    title: 'Educator Co-Pilot',
    desc: 'Let educators generate quizzes, rubrics, and personalized learner feedback with one click.',
    color: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    icon: Shield,
    title: 'Smart Study Plans',
    desc: 'AI-generated weekly schedules that adapt as you progress, keeping you on track for your goals.',
    color: 'from-orange-500 to-amber-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
  },
  {
    icon: Play,
    title: 'Live & Recorded Lectures',
    desc: 'Access all video content — YouTube links, uploaded videos, and recorded live sessions.',
    color: 'from-red-500 to-rose-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
  },
  {
    icon: Zap,
    title: 'Instant AI Quizzes',
    desc: 'Generate practice quizzes on any topic in seconds with clear, learner-friendly questions.',
    color: 'from-indigo-500 to-violet-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
  },
];

const steps = [
  { num: '01', title: 'Create your profile', desc: 'Sign up and tell us your goals, timeline, and current level.', icon: Sparkles },
  { num: '02', title: 'Pick a pathway', desc: 'Choose a guided AI track or enroll in educator-led courses.', icon: Target },
  { num: '03', title: 'Learn every day', desc: 'Your plan, quizzes, and feedback evolve with you in real-time.', icon: Rocket },
];

const testimonials = [
  { name: 'Priya M.', role: 'CS Learner', text: 'The AI study plans are incredible — my exam scores jumped 30% in 2 months!', avatar: 'PM' },
  { name: 'Rahul K.', role: 'Full-Stack Developer', text: 'Best adaptive quizzes I have used. The questions are perfectly matched to my level.', avatar: 'RK' },
  { name: 'Anita S.', role: 'Educator', text: 'I can create and manage course content effortlessly. My learners love the platform.', avatar: 'AS' },
];

export default function Home() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const timerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '/api') + '/courses/public?search=' + encodeURIComponent(query.trim()));
        const json = await res.json();
        setResults(json.data || []);
        setShowResults(true);
      } catch { setResults([]); }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050509] overflow-hidden font-sans selection:bg-blue-500/30">
      <PublicNavbar />

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-10 pb-12 lg:pt-16 lg:pb-16 px-6 overflow-hidden">
        {/* Animated mesh background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/50 to-pink-50/80 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/30" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/15 dark:bg-blue-500/8 rounded-full blur-[100px] animate-float" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400/15 dark:bg-purple-500/8 rounded-full blur-[100px] animate-float-slow" />
          <div className="absolute top-1/3 right-1/6 w-[400px] h-[400px] bg-pink-400/10 dark:bg-pink-500/5 rounded-full blur-[80px] animate-float" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/5 backdrop-blur-sm mb-8 border border-gray-200/50 dark:border-gray-800/50 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-[0.22em]">
                AI‑POWERED LEARNING PLATFORM
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.05]">
              Your studies,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 animate-gradient">
                reimagined
              </span>
              <br className="hidden sm:block" />
              by AI
            </h1>

            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Not just courses — a living platform that maps what you know, predicts where you'll struggle,
              and builds a <span className="font-semibold text-gray-700 dark:text-gray-300">personalized study plan</span> around your goals.
            </p>

            {/* Course Search Bar */}
            <div ref={searchRef} className="relative max-w-xl mx-auto mb-10">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses... e.g. Java, React, Machine Learning"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                  onFocus={() => results.length > 0 && setShowResults(true)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 shadow-lg shadow-gray-200/50 dark:shadow-black/20 placeholder:text-gray-400"
                />
                {searching && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
              </div>
              {showResults && query.trim().length >= 2 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-72 overflow-y-auto animate-fade-in-up">
                  {results.length === 0 && !searching && (
                    <div className="p-6 text-center text-sm text-gray-500">
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
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/10 dark:to-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={16} className="text-blue-600 dark:text-blue-400" />
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

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to={user ? '/' + user.role + '/dashboard' : '/register'}
                className="group inline-flex items-center gap-2.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-3.5 rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5"
              >
                {user ? <Compass size={18} /> : <Sparkles size={18} />}
                <span>{user ? 'Go to Dashboard' : 'Start Free — No Credit Card'}</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  <LogIn size={16} />
                  <span>Already have an account? Sign in</span>
                </Link>
              )}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Free to start</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> AI-powered</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> For learners & educators</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-500" /> Adaptive quizzes</span>
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-in-up-delay">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-800/70 bg-white/95 dark:bg-gray-900/80 shadow-2xl backdrop-blur-xl">
                {/* Window chrome */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-1 rounded-md">
                      personalizedlearning.ai/dashboard
                    </span>
                  </div>
                </div>

                {/* Dashboard mockup content */}
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Average Score', value: '87%', color: 'text-blue-600' },
                      { label: 'Courses', value: '6', color: 'text-purple-600' },
                      { label: 'Quizzes Done', value: '42', color: 'text-emerald-600' },
                      { label: 'AI Plans', value: '3', color: 'text-orange-600' },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-[11px] text-gray-500 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-5 text-white">
                      <p className="text-[11px] uppercase tracking-wider text-white/70 mb-2">Today's AI Focus</p>
                      <p className="text-sm font-semibold">Complete 2 micro-lessons in Data Structures</p>
                      <p className="text-xs text-white/60 mt-2">Based on quiz performance analysis</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-5">
                      <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Confidence Map</p>
                      <div className="flex items-end gap-2 h-16">
                        {[60, 85, 40, 70, 90, 55].map((h, i) => (
                          <div key={i} className="flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="rounded-full transition-all duration-700"
                              style={{ height: `${h}%`, background: `hsl(${200 + i * 25}, 70%, 55%)` }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-2">Web ✓ · Algorithms ↗ · Systems ↗</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative py-14 px-6 border-y border-gray-100 dark:border-gray-900/50 bg-gray-50/70 dark:bg-gray-950/50">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 mb-3 group-hover:scale-110 transition-transform duration-300">
                <s.icon size={22} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-0.5">
                {s.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto animate-fade-in-up">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 mb-3">
              EVERYTHING YOU NEED
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              A platform that learns <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">you</span> back
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400">
              AI-powered analytics, adaptive quizzes, smart study plans, and educator tools — all in one place.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group relative ${f.bg} rounded-2xl p-7 border border-gray-200/50 dark:border-gray-800/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-14 px-6 bg-gray-50/80 dark:bg-gray-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-purple-600 dark:text-purple-400 mb-3">
              GET STARTED IN MINUTES
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
              How PLP fits your day
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Sign in for 20 minutes and still make meaningful progress.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-16 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-300/50 via-purple-300/50 to-pink-300/50 dark:from-blue-700/30 dark:via-purple-700/30 dark:to-pink-700/30" />

            {steps.map((s, i) => (
              <div
                key={s.num}
                className="relative text-center animate-fade-in-up"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-5 shadow-xl shadow-blue-500/25">
                  <s.icon size={26} />
                </div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.22em] mb-2">
                  Step {s.num}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 animate-fade-in-up">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 mb-3">
              LOVED BY LEARNERS
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">
              What our users say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="bg-white dark:bg-gray-900 rounded-2xl p-7 border border-gray-200/60 dark:border-gray-800/60 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  "{t.text}"
                </p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 md:p-16 text-center animate-gradient shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Ready to transform your learning?
              </h2>
              <p className="text-base md:text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of learners and educators who use AI to make every study session count.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-base font-bold text-blue-600 bg-white hover:bg-gray-50 px-8 py-3.5 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Sparkles size={18} />
                  Create free account
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white transition-colors"
                >
                  Learn how it works
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-100 dark:bg-gray-950 py-16 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <GraduationCap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">PLP</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              An AI-powered campus for learners, educators, and admins who want learning to feel
              designed — not generic.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-gray-900 dark:text-white text-xs uppercase tracking-[0.22em]">Platform</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
              <li><Link to="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">How it works</Link></li>
              <li><Link to="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Learner dashboard</Link></li>
              <li><Link to="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Educator workspace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900 dark:text-white text-xs uppercase tracking-[0.22em]">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Product updates</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help center</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-gray-900 dark:text-white text-xs uppercase tracking-[0.22em]">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy policy</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of service</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">Cookie settings</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <p>&copy; 2026 Personalized Learning Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}