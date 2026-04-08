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
      <section className="relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
          <div className="max-w-3xl">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800/50 mb-6">
              <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">AI-Powered Learning · Trusted by 12,840+ learners</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1] mb-6">
              Learn without limits,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 dark:from-purple-400 dark:via-violet-400 dark:to-blue-400">
                grow without boundaries
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl leading-relaxed">
              Access 350+ courses taught by industry experts. Our AI adapts to how you learn, finds your weak spots, and builds a personalized path to mastery.
            </p>

            {/* Hero search */}
            <form onSubmit={handleHeroSearch} className="flex items-center gap-0 max-w-lg mb-6">
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 border-r-0 rounded-l-full px-5 py-3.5 focus-within:border-purple-400 dark:focus-within:border-purple-500 transition-colors">
                <Search size={20} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="What do you want to learn?"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-base text-gray-900 dark:text-white placeholder:text-gray-400"
                />
              </div>
              <button type="submit" className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold px-7 py-3.5 rounded-r-full transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
                Search
              </button>
            </form>

            {/* Popular topics */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Popular:</span>
              {['Python', 'React', 'Machine Learning', 'System Design', 'AWS'].map(t => (
                <Link key={t} to="/tracks" className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-colors font-medium">
                  {t}
                </Link>
              ))}
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
                <span className="text-lg font-bold text-white">LearnAI</span>
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
            <p className="text-xs text-gray-500">&copy; 2026 LearnAI. All rights reserved.</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">Made with <Heart size={12} className="text-red-500 fill-red-500" /> in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}