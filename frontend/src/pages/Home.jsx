import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import {
  GraduationCap, Brain, BarChart3, Award, ArrowRight, Users,
  BookOpen, Star, Sparkles, Target, Clock, Layers, Play, Zap,
  Shield, CheckCircle2, Search, Code, Database, Briefcase,
  TrendingUp, Globe, ChevronRight, Quote, Heart, Monitor,
} from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

/* ── Data ── */
const stats = [
  { value: '12,840+', label: 'Active Learners', icon: Users },
  { value: '350+', label: 'Courses', icon: BookOpen },
  { value: '120+', label: 'Expert Educators', icon: GraduationCap },
  { value: '4.8/5', label: 'Avg Rating', icon: Star },
];

const categories = [
  { icon: Brain, label: 'Data Science & AI', count: '84 courses', color: 'from-blue-500 to-cyan-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  { icon: Code, label: 'Web Development', count: '120 courses', color: 'from-emerald-500 to-teal-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  { icon: Database, label: 'Cloud & DevOps', count: '45 courses', color: 'from-purple-500 to-violet-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  { icon: Monitor, label: 'System Design', count: '38 courses', color: 'from-amber-500 to-orange-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  { icon: Briefcase, label: 'Career Prep', count: '56 courses', color: 'from-rose-500 to-pink-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  { icon: BarChart3, label: 'Analytics', count: '32 courses', color: 'from-indigo-500 to-blue-400', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  { icon: Shield, label: 'Cybersecurity', count: '28 courses', color: 'from-red-500 to-orange-400', bg: 'bg-red-50 dark:bg-red-950/30' },
  { icon: Globe, label: 'Digital Marketing', count: '41 courses', color: 'from-teal-500 to-green-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
];

const featuredCourses = [
  { id: 1, title: 'Complete Machine Learning Bootcamp', educator: 'Dr. Priya Sharma', rating: 4.9, reviews: 2340, price: 499, originalPrice: 3999, image: '🤖', tag: 'Bestseller', tagColor: 'bg-yellow-100 text-yellow-800' },
  { id: 2, title: 'Full-Stack React & Node.js Masterclass', educator: 'Arjun Mehta', rating: 4.8, reviews: 1870, price: 599, originalPrice: 4999, image: '⚛️', tag: 'Hot & New', tagColor: 'bg-red-100 text-red-700' },
  { id: 3, title: 'System Design for Senior Engineers', educator: 'Vikram Patel', rating: 4.9, reviews: 890, price: 799, originalPrice: 5999, image: '🏗️', tag: 'Highest Rated', tagColor: 'bg-emerald-100 text-emerald-700' },
  { id: 4, title: 'Generative AI & Prompt Engineering', educator: 'Sneha Gupta', rating: 4.7, reviews: 3100, price: 399, originalPrice: 2999, image: '🧠', tag: 'Trending', tagColor: 'bg-purple-100 text-purple-700' },
];

const testimonials = [
  { name: 'Ananya Reddy', role: 'SDE-2 at Google', text: 'The AI-powered study plan literally doubled my learning speed. I cracked my Google interview in 3 months.', avatar: '👩‍💻' },
  { name: 'Rohit Kumar', role: 'Data Scientist at Amazon', text: 'Best ML course I\'ve taken. The adaptive quizzes found my weak spots and fixed them automatically.', avatar: '👨‍🔬' },
  { name: 'Meera Joshi', role: 'Full-Stack Developer', text: 'Went from zero coding experience to landing a ₹18 LPA job. The platform made it feel effortless.', avatar: '👩‍🎓' },
];

const benefits = [
  { icon: TrendingUp, title: 'Earn on your terms', desc: 'Set your own prices and earn up to 97% revenue on every sale.' },
  { icon: Users, title: 'Reach thousands', desc: 'Access our growing community of 12,000+ active learners.' },
  { icon: Brain, title: 'AI co-pilot', desc: 'Our AI generates quizzes, rubrics, and personalized feedback for you.' },
  { icon: Globe, title: 'Teach globally', desc: 'Your courses reach students worldwide with built-in translation.' },
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-bold text-gray-900 dark:text-white">{rating}</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} size={14} className={i <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  usePageTitle('Home');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) navigate(user ? '/learner/courses' : '/login');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <PublicNavbar />

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden min-h-[600px] lg:min-h-[680px]">
        {/* Gradient mesh background — richer, more layered */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute top-10 -left-32 w-[500px] h-[500px] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[100px] animate-hero-glow" />
        <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[100px] animate-hero-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/30 dark:bg-indigo-900/10 rounded-full blur-[120px]" />
        
        {/* Subtle dot pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* ── LEFT COLUMN: Content ── */}
            <div className="animate-hero-enter-l">
              {/* Trust badge with subtle bounce */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-purple-200/60 dark:border-purple-700/40 shadow-sm shadow-purple-500/10 mb-8 animate-hero-badge">
                <div className="flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
                <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 tracking-wide">AI-Powered Learning · Trusted by 12,840+ learners</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.08] mb-6">
                Learn without limits,{' '}
                <span className="hero-gradient-text bg-gradient-to-r from-purple-600 via-violet-500 to-blue-600 dark:from-purple-400 dark:via-violet-400 dark:to-blue-400">
                  grow without boundaries
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-xl leading-relaxed">
                Access <span className="font-semibold text-gray-900 dark:text-white">350+ courses</span> taught by industry experts. Our AI adapts to how you learn, finds your weak spots, and builds a <span className="font-semibold text-gray-900 dark:text-white">personalized path</span> to mastery.
              </p>

              {/* Hero search — glassmorphic */}
              <form onSubmit={handleHeroSearch} className="flex items-center gap-0 max-w-lg mb-8 group">
                <div className="flex-1 flex items-center gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-2 border-gray-200 dark:border-gray-700 border-r-0 rounded-l-2xl px-5 py-4 focus-within:border-purple-400 dark:focus-within:border-purple-500 transition-all shadow-sm group-focus-within:shadow-lg group-focus-within:shadow-purple-500/10">
                  <Search size={20} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="What do you want to learn?"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base text-gray-900 dark:text-white placeholder:text-gray-400"
                  />
                </div>
                <button type="submit" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold px-8 py-4 rounded-r-2xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0">
                  Search
                </button>
              </form>

              {/* Popular topics */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Popular:</span>
                {['Python', 'React', 'Machine Learning', 'System Design', 'AWS'].map((t, i) => (
                  <Link key={t} to="/tracks" className="px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-200 dark:hover:border-purple-700 transition-all font-medium hover:-translate-y-0.5 shadow-sm" style={{ animationDelay: `${i * 0.1}s` }}>
                    {t}
                  </Link>
                ))}
              </div>

              {/* Mini social proof */}
              <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-800/50">
                <div className="flex -space-x-2">
                  {['👩‍💻', '👨‍🔬', '👩‍🎓', '👨‍💼'].map((emoji, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 border-2 border-white dark:border-gray-900 flex items-center justify-center text-sm shadow-sm">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">4.8/5</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">from 12,840+ happy learners</p>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Visual Composition ── */}
            <div className="hidden lg:block animate-hero-enter-r">
              <div className="relative w-full h-[520px]">
                {/* Central glowing orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-500/10 dark:to-blue-500/10 blur-2xl animate-hero-glow" />
                
                {/* Orbital ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px]">
                  <div className="w-full h-full rounded-full border border-dashed border-purple-200/50 dark:border-purple-800/30 animate-hero-ring" />
                  {/* Orbiting dots */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 animate-hero-dot" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-hero-dot" style={{ animationDelay: '1s' }} />
                </div>
                
                {/* Second orbital ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px]">
                  <div className="w-full h-full rounded-full border border-dotted border-blue-200/30 dark:border-blue-800/20 animate-hero-ring" style={{ animationDirection: 'reverse', animationDuration: '35s' }} />
                </div>

                {/* Central icon cluster */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-2xl shadow-purple-500/40 flex items-center justify-center animate-hero-float-2">
                  <Brain size={40} className="text-white" />
                </div>

                {/* Floating Card 1 — AI Adaptive */}
                <div className="absolute top-4 left-6 animate-hero-float-1">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl shadow-purple-500/10 p-4 w-52">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <Target size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">AI Adaptive</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Personalized path</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ animation: 'shimmer 2s linear infinite', backgroundSize: '200% 100%' }} />
                    </div>
                  </div>
                </div>

                {/* Floating Card 2 — Course Progress */}
                <div className="absolute top-6 right-0 animate-hero-float-3">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl shadow-blue-500/10 p-4 w-48">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Course Progress</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">↑ 12%</span>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">78%</p>
                    <div className="flex gap-1 items-end h-8">
                      {[12, 18, 14, 22, 20, 10, 8].map((h, i) => (
                        <div key={i} className={`flex-1 rounded-sm ${i <= 4 ? 'bg-gradient-to-t from-blue-500 to-blue-400' : 'bg-gray-100 dark:bg-gray-700'}`} style={{ height: `${h}px` }} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating Card 3 — Live Learners */}
                <div className="absolute bottom-16 left-0 animate-hero-float-2">
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl shadow-emerald-500/10 p-4 w-52">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                          <Users size={20} className="text-white" />
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-gray-800"></span>
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">1,247 learners</p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Online right now</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 4 — Achievement */}
                <div className="absolute bottom-8 right-4 animate-hero-float-1" style={{ animationDelay: '1.5s' }}>
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-xl shadow-amber-500/10 p-4 w-44">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Award size={16} className="text-white" />
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">Achievement</p>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-2">Completed ML Mastery</p>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                    </div>
                  </div>
                </div>

                {/* Small floating icons */}
                <div className="absolute top-32 left-1/2 animate-hero-float-3" style={{ animationDelay: '0.8s' }}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 flex items-center justify-center">
                    <Zap size={18} className="text-blue-500" />
                  </div>
                </div>

                <div className="absolute bottom-40 right-24 animate-hero-float-1" style={{ animationDelay: '2s' }}>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 backdrop-blur-sm border border-amber-200/30 dark:border-amber-700/30 flex items-center justify-center">
                    <Sparkles size={18} className="text-amber-500" />
                  </div>
                </div>

                {/* Connecting gradient lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-10" viewBox="0 0 500 520">
                  <defs>
                    <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                  <line x1="130" y1="80" x2="250" y2="260" stroke="url(#line-grad)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="370" y1="80" x2="250" y2="260" stroke="url(#line-grad)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="130" y1="400" x2="250" y2="260" stroke="url(#line-grad)" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="370" y1="440" x2="250" y2="260" stroke="url(#line-grad)" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className="border-y border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 group">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30 group-hover:scale-110 transition-transform">
                  <s.icon size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIES GRID ═══════════ */}
      <section className="py-16 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Top Categories</h2>
              <p className="text-gray-500 dark:text-gray-400">Explore our most popular learning paths</p>
            </div>
            <Link to="/tracks" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link key={cat.label} to="/tracks"
                className={`${cat.bg} rounded-2xl p-5 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg transition-all duration-300 group`}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <cat.icon size={22} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{cat.label}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED COURSES ═══════════ */}
      <section className="py-16 px-4 lg:px-6 bg-gray-50/80 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Featured Courses</h2>
              <p className="text-gray-500 dark:text-gray-400">Hand-picked by our AI and community</p>
            </div>
            <Link to={user ? '/learner/courses' : '/register'} className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
              Browse all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredCourses.map((course) => (
              <Link key={course.id} to={user ? '/learner/courses' : '/register'}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 hover:-translate-y-1 transition-all duration-300 group">
                {/* Image area */}
                <div className="relative h-36 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                  <span className="text-5xl group-hover:scale-110 transition-transform">{course.image}</span>
                  {course.tag && (
                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-md ${course.tagColor}`}>
                      {course.tag}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors" />
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-snug">{course.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{course.educator}</p>
                  <div className="flex items-center gap-1.5 mb-3">
                    <StarRating rating={course.rating} />
                    <span className="text-xs text-gray-400">({course.reviews.toLocaleString()})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white">₹{course.price}</span>
                    <span className="text-sm text-gray-400 line-through">₹{course.originalPrice}</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                      {Math.round((1 - course.price / course.originalPrice) * 100)}% off
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AI FEATURES HIGHLIGHT ═══════════ */}
      <section className="py-16 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Why learners choose us</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Our AI doesn't just deliver content — it learns how <em>you</em> learn.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: 'Adaptive Learning', desc: 'AI adjusts difficulty in real-time based on your performance, keeping you in the optimal learning zone.', color: 'from-purple-500 to-violet-500' },
              { icon: Target, title: 'Weak-Spot Detection', desc: 'Our system identifies knowledge gaps and generates targeted drills to close them fast.', color: 'from-blue-500 to-cyan-500' },
              { icon: Zap, title: 'Instant AI Feedback', desc: 'Get detailed explanations after every quiz. Mistakes become powerful learning moments.', color: 'from-amber-500 to-orange-500' },
            ].map((f) => (
              <div key={f.title} className="relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-7 hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon size={26} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-16 px-4 lg:px-6 bg-gray-50/80 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">What our learners say</h2>
            <p className="text-gray-500 dark:text-gray-400">Real stories from real people</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all">
                <Quote size={24} className="text-purple-300 dark:text-purple-700 mb-4" />
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TEACH ON PLATFORM ═══════════ */}
      <section className="py-16 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(139,92,246,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="relative grid lg:grid-cols-2 gap-10 p-10 md:p-14">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 mb-5">
                  <GraduationCap size={14} className="text-purple-400" />
                  <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">For Educators</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                  Teach on our platform
                </h2>
                <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                  Join thousands of educators earning money and making an impact. Our AI co-pilot handles quiz generation, analytics, and personalized feedback — so you can focus on teaching.
                </p>
                <Link to="/become-educator"
                  className="inline-flex items-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 px-8 py-3.5 rounded-full shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:-translate-y-0.5">
                  Start Teaching Today <ArrowRight size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((b) => (
                  <div key={b.title} className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-colors">
                    <b.icon size={24} className="text-purple-400 mb-3" />
                    <h4 className="text-sm font-bold text-white mb-1">{b.title}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-16 px-4 lg:px-6 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Start learning today</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            Join 12,840+ learners who are already accelerating their careers with AI-powered learning.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register"
              className="inline-flex items-center gap-2 text-base font-semibold text-purple-700 bg-white hover:bg-gray-50 px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
              Sign up for free <ArrowRight size={18} />
            </Link>
            <Link to="/features"
              className="inline-flex items-center gap-2 text-base font-semibold text-white/90 border-2 border-white/30 hover:border-white/60 px-8 py-3.5 rounded-full transition-all hover:-translate-y-0.5">
              Explore features
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-gray-900 dark:bg-gray-950 pt-14 pb-8 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600">
                  <GraduationCap size={18} className="text-white" />
                </div>
                <span className="text-lg font-bold text-white">PLP</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">AI-powered personalized learning platform trusted by thousands of learners and educators worldwide.</p>
            </div>
            {[
              { title: 'Platform', links: [['Home', '/'], ['Features', '/features'], ['Tracks', '/tracks'], ['AI Insights', '/insights']] },
              { title: 'Company', links: [['About', '/about'], ['Become an Educator', '/about'], ['Contact', '/about']] },
              { title: 'Legal', links: [['Privacy Policy', '#'], ['Terms of Service', '#'], ['Cookie Policy', '#']] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}><Link to={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">&copy; 2026 PLP. All rights reserved.</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">Made with <Heart size={12} className="text-red-500 fill-red-500" /> in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}