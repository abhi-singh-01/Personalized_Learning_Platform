import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import usePageTitle from '../hooks/usePageTitle';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';
import {
  GraduationCap, ArrowRight, Users, Brain, Globe, TrendingUp,
  DollarSign, BarChart3, Video, BookOpen, Star, CheckCircle2,
  Zap, Shield, Award, ChevronDown, Play, Sparkles, Clock,
  MessageSquare, FileText, Monitor, PieChart, Mic, Heart,
  Target, Lightbulb, Rocket, ChevronRight, Quote,
} from 'lucide-react';

/* ─── Animated Counter Hook ─── */
function useCounter(target, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const numTarget = parseInt(String(target).replace(/[^0-9]/g, ''), 10);
          const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numTarget));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, startOnView]);

  return { count, ref };
}

/* ─── Counter Card ─── */
function StatCounter({ value, suffix = '', prefix = '', label, icon: Icon }) {
  const numericPart = value.replace(/[^0-9]/g, '');
  const { count, ref } = useCounter(numericPart);
  return (
    <div ref={ref} className="text-center group">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 mb-4 group-hover:scale-110 transition-transform duration-300">
        <Icon size={28} className="text-purple-500" />
      </div>
      <div className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    </div>
  );
}

/* ─── FAQ Accordion ─── */
function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors pr-4">{q}</span>
        <ChevronDown
          size={20}
          className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-500' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Data ─── */
const reasons = [
  {
    icon: DollarSign,
    title: 'Earn revenue your way',
    desc: 'Set your own course prices with up to 97% revenue share. No hidden fees, completely transparent payouts.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    icon: Brain,
    title: 'AI does the heavy lifting',
    desc: 'Auto-generate quizzes, study plans, and performance reports. Our AI identifies at-risk learners before they drop off.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: Users,
    title: 'Reach a global audience',
    desc: 'Your courses are instantly available to 12,000+ active learners worldwide. Built-in discovery drives enrollments.',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    icon: Video,
    title: 'Live classes, built in',
    desc: 'Schedule lectures, host live sessions with screen sharing, and auto-record everything for on-demand replay.',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    icon: BarChart3,
    title: 'Deep, real-time analytics',
    desc: 'Track revenue, learner engagement, quiz performance, and progress — all from a single dashboard.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    icon: Shield,
    title: 'You\'re always in control',
    desc: 'Manage coupons, set discounts, revoke access — you decide how your content is shared and monetized.',
    gradient: 'from-indigo-500 to-blue-600',
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Lightbulb,
    title: 'Plan your curriculum',
    desc: 'Pick a topic you\'re passionate about, outline your syllabus, and define learning objectives. Our AI can help you structure it.',
  },
  {
    step: 2,
    icon: Monitor,
    title: 'Create engaging content',
    desc: 'Upload videos, PDFs, and notes. Use our built-in editor and AI quiz generator to build interactive assessments.',
  },
  {
    step: 3,
    icon: Rocket,
    title: 'Launch & grow',
    desc: 'Set your price, publish your course, and watch enrollments come in. Use analytics to iterate and improve.',
  },
];

const features = [
  { icon: BookOpen, text: 'Drag-and-drop course builder' },
  { icon: Brain, text: 'AI-powered quiz generator (MCQ, subjective, coding)' },
  { icon: Video, text: 'Live lecture scheduling & recording' },
  { icon: BarChart3, text: 'Learner performance analytics' },
  { icon: DollarSign, text: 'Revenue & payout dashboard' },
  { icon: Shield, text: 'Coupon & discount management' },
  { icon: Zap, text: 'At-risk learner alerts' },
  { icon: FileText, text: 'PDF report exporter' },
  { icon: MessageSquare, text: 'In-course discussions' },
  { icon: PieChart, text: 'Engagement scoring' },
];

const testimonials = [
  {
    name: 'Prof. Rajesh Kumar',
    role: 'Machine Learning Instructor',
    learners: '2,300 learners',
    text: 'I earned ₹4.2L in my first 6 months. The AI quiz generator saves me hours every week and my students love the adaptive learning paths.',
    avatar: '👨‍🏫',
    rating: 5,
  },
  {
    name: 'Sneha Patel',
    role: 'Full-Stack Developer',
    learners: '1,800 learners',
    text: 'The live lecture feature is game-changing. I run weekly bootcamp sessions and the auto-recording means no one misses a thing.',
    avatar: '👩‍💻',
    rating: 5,
  },
  {
    name: 'Dr. Amit Sharma',
    role: 'Data Science Expert',
    learners: '3,100 learners',
    text: 'Best platform for educators in India. The analytics dashboard gives me crystal-clear insights into where my students need help.',
    avatar: '👨‍🔬',
    rating: 5,
  },
];

const faqs = [
  {
    q: 'Is it free to become an educator?',
    a: 'Absolutely. Creating an educator account is 100% free. There are no upfront fees or monthly charges. We only take a small platform fee when you make a sale.',
  },
  {
    q: 'How much revenue do I keep?',
    a: 'You keep up to 97% of the course price. We charge a transparent 2% platform fee plus applicable GST. Payouts are processed regularly to your bank account.',
  },
  {
    q: 'What kind of courses can I create?',
    a: 'You can create video-based courses, text courses with PDFs and notes, live lecture-based courses, or a combination. We support all subjects — from programming to arts to business.',
  },
  {
    q: 'Do I need technical knowledge to get started?',
    a: 'Not at all. Our course builder is drag-and-drop simple. Just upload your content, and our AI will help you generate quizzes and structure your curriculum.',
  },
  {
    q: 'Can I host live classes?',
    a: 'Yes! You can schedule live lectures, share your screen, interact with students in real-time, and all sessions are automatically recorded for students who miss the live session.',
  },
  {
    q: 'How do learners find my courses?',
    a: 'Your courses appear in our course catalog, search results, and recommendations. Our AI-powered discovery engine surfaces your content to the most relevant learners.',
  },
];

export default function BecomeEducator() {
  usePageTitle('Become an Educator — LearnAI');
  const { user } = useAuth();
  const api = useApi();
  const nav = useNavigate();
  const toast = useToast();
  const [upgrading, setUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(0);

  const handleUpgradeRole = async () => {
    if (!user) { nav('/register?role=educator'); return; }
    if (user.role === 'educator') { nav('/educator/dashboard'); return; }

    setUpgrading(true);
    try {
      await api.put('/auth/upgrade-to-educator');
      toast.success('Welcome, Educator! Your account has been upgraded 🎉');
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = '/educator/dashboard';
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const ctaAction = () => {
    if (!user) nav('/register?role=educator');
    else if (user.role === 'educator') nav('/educator/dashboard');
    else handleUpgradeRole();
  };

  const ctaLabel = !user
    ? 'Get started'
    : user.role === 'educator'
    ? 'Go to Dashboard'
    : 'Start teaching';

  const ctaLoginAction = () => nav('/login?role=educator');

  /* ─── Inline Styles for Animations ─── */
  const animCSS = `
    @keyframes float-educator {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }
    @keyframes float-slow-educator {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.15); opacity: 0.1; }
      100% { transform: scale(1); opacity: 0.3; }
    }
    .animate-float-edu { animation: float-educator 4s ease-in-out infinite; }
    .animate-float-slow-edu { animation: float-slow-educator 5s ease-in-out infinite; }
    .animate-slide-up { animation: slide-up 0.8s ease-out both; }
    .animate-slide-up-d1 { animation: slide-up 0.8s ease-out 0.1s both; }
    .animate-slide-up-d2 { animation: slide-up 0.8s ease-out 0.2s both; }
    .animate-slide-up-d3 { animation: slide-up 0.8s ease-out 0.3s both; }
    .animate-pulse-ring { animation: pulse-ring 3s ease-in-out infinite; }
  `;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A]">
      <style>{animCSS}</style>
      <PublicNavbar />

      {/* ═══ Success Modal ═══ */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome, Educator! 🎉</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Your account has been upgraded. Redirecting to your educator dashboard...</p>
            <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          HERO — Udemy Style: Centered text with image
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.08),transparent_60%)]" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full border border-purple-500/10 animate-pulse-ring" />
        <div className="absolute bottom-20 right-[10%] w-48 h-48 rounded-full border border-blue-500/10 animate-pulse-ring" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-[15%] w-3 h-3 rounded-full bg-purple-500/30 animate-float-edu" />
        <div className="absolute bottom-1/3 left-[20%] w-2 h-2 rounded-full bg-blue-500/30 animate-float-slow-edu" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-20 lg:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Text */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest">Become an Educator</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold tracking-tight text-white leading-[1.08] mb-6">
                Come teach{' '}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400">with us</span>
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-50" />
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
                Become an instructor and change lives — including your own. Join a community of 120+ educators teaching 12,000+ learners on LearnAI.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={ctaAction}
                  disabled={upgrading}
                  className="inline-flex items-center gap-2.5 text-base font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 px-8 py-4 rounded-xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {ctaLabel}
                  <ArrowRight size={18} />
                </button>

                {!user && (
                  <button
                    onClick={ctaLoginAction}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-6 py-3.5 rounded-xl transition-all duration-300"
                  >
                    Already a member? Sign in
                  </button>
                )}
              </div>
            </div>

            {/* Right — Hero Image with floating cards */}
            <div className="relative animate-slide-up-d2 hidden lg:block">
              <div className="relative">
                {/* Glow behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl blur-3xl scale-110" />

                {/* Main image */}
                <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src="/educator-hero.png"
                    alt="Educator teaching on LearnAI"
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
                </div>

                {/* Floating stat cards */}
                <div className="absolute -left-8 top-1/4 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-800 animate-float-edu">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <TrendingUp size={20} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-gray-900 dark:text-white">₹4.2L</p>
                      <p className="text-[11px] text-gray-500">Avg. earnings / 6mo</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-6 top-1/3 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-800 animate-float-slow-edu">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Users size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-lg font-extrabold text-gray-900 dark:text-white">12,840+</p>
                      <p className="text-[11px] text-gray-500">Active learners</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 left-1/4 bg-white dark:bg-gray-900 rounded-2xl p-3 px-4 shadow-2xl border border-gray-200 dark:border-gray-800 animate-float-edu" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] text-white font-bold">R</div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] text-white font-bold">S</div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] text-white font-bold">A</div>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">120+ Educators</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STATS BAR — Animated counters
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative -mt-1 bg-white dark:bg-[#0A0A0A] border-t border-gray-100 dark:border-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <StatCounter value="12840" suffix="+" label="Active Learners" icon={Users} />
            <StatCounter value="97" suffix="%" label="Revenue Share" icon={DollarSign} />
            <StatCounter value="120" suffix="+" label="Expert Educators" icon={GraduationCap} />
            <StatCounter value="48" prefix="" suffix="/5" label="Average Rating" icon={Star} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          REASONS — "So many reasons to start"
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-4 lg:px-6 bg-gray-50/80 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              So many reasons to start
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need to build a thriving online teaching business, all in one platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {reasons.map((r, i) => (
              <div
                key={r.title}
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 hover:shadow-2xl hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-500 group overflow-hidden"
              >
                {/* Subtle gradient glow on hover */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${r.gradient} opacity-0 group-hover:opacity-5 rounded-full blur-2xl transition-opacity duration-500 -translate-y-8 translate-x-8`} />

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <r.icon size={26} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{r.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW TO BEGIN — Udemy-style steps
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-4 lg:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              How to begin
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
              From sign-up to your first sale in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-purple-300 via-violet-300 to-blue-300 dark:from-purple-700 dark:via-violet-700 dark:to-blue-700 z-0" />

            {howItWorks.map((step, i) => (
              <div key={step.step} className="relative text-center px-6 lg:px-10 mb-10 md:mb-0">
                {/* Step circle */}
                <div className="relative z-10 mx-auto mb-6">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-2 border-purple-200 dark:border-purple-800 flex items-center justify-center mx-auto group hover:scale-105 transition-transform duration-300">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
                      <step.icon size={32} className="text-white" />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-xs font-extrabold shadow-lg">
                    {step.step}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <button
              onClick={ctaAction}
              disabled={upgrading}
              className="inline-flex items-center gap-2.5 text-base font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 px-10 py-4 rounded-xl shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {ctaLabel}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          EDUCATOR DASHBOARD FEATURES
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-4 lg:px-6 bg-gray-50/80 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 mb-6">
                <Award size={14} className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Your Dashboard</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                Everything you need, in one place
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Your educator dashboard is packed with powerful tools to create, manage, and grow your courses. Here's what's waiting for you:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map(f => (
                  <div key={f.text} className="flex items-start gap-3 group">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 mt-0.5 shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                      <f.icon size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-snug">{f.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Visual representation */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 via-violet-50 to-blue-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 dark:border dark:border-gray-800 rounded-3xl p-8 lg:p-10">
                {/* Mini dashboard mockup */}
                <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  {/* Title bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs text-gray-400 ml-3 font-mono">educator/dashboard</span>
                  </div>

                  <div className="p-5">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        { label: 'Revenue', value: '₹2.4L', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                        { label: 'Learners', value: '1,240', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                        { label: 'Rating', value: '4.9★', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                      ].map(s => (
                        <div key={s.label} className={`${s.bg} rounded-xl p-3`}>
                          <p className={`text-lg font-extrabold ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Chart placeholder */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
                      <div className="flex items-end gap-1.5 h-20 justify-center">
                        {[40, 55, 35, 70, 60, 85, 75, 90, 65, 80, 95, 88].map((h, i) => (
                          <div
                            key={i}
                            className="w-4 rounded-t-md bg-gradient-to-t from-purple-500 to-violet-400 transition-all duration-500"
                            style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">Monthly Revenue Trend</p>
                    </div>

                    {/* Recent activity */}
                    <div className="space-y-2">
                      {[
                        { text: 'New enrollment in ML Basics', time: '2m ago', dot: 'bg-emerald-500' },
                        { text: 'Quiz completed by 24 learners', time: '1h ago', dot: 'bg-blue-500' },
                        { text: 'Live class scheduled', time: '3h ago', dot: 'bg-purple-500' },
                      ].map(a => (
                        <div key={a.text} className="flex items-center gap-2.5 text-xs">
                          <div className={`w-1.5 h-1.5 rounded-full ${a.dot} shrink-0`} />
                          <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">{a.text}</span>
                          <span className="text-gray-400 shrink-0">{a.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TESTIMONIALS — Large quote cards (Udemy style)
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Hear from our educators
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Real stories from instructors building successful careers on LearnAI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 hover:shadow-2xl hover:border-purple-200 dark:hover:border-purple-700 transition-all duration-500 group"
              >
                {/* Quote icon */}
                <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Quote size={60} className="text-purple-600" />
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-8 relative z-10">
                  "{t.text}"
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 flex items-center justify-center text-2xl">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                    <p className="text-xs text-purple-500 font-semibold">{t.learners}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FAQ — Accordion
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 px-4 lg:px-6 bg-gray-50/80 dark:bg-gray-950/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-8">
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                q={faq.q}
                a={faq.a}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? -1 : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA — Bold gradient banner (Udemy style)
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute top-10 right-[10%] w-48 h-48 rounded-full border border-white/10 animate-float-edu" />
        <div className="absolute bottom-10 left-[15%] w-32 h-32 rounded-full border border-white/10 animate-float-slow-edu" />

        <div className="relative max-w-4xl mx-auto text-center px-4 py-20 lg:py-28">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-8">
            <Heart size={14} className="text-white" />
            <span className="text-xs font-semibold text-white/80 uppercase tracking-widest">Join our community</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Become an educator today
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
            It's completely free to get started. Create your first course and reach thousands of eager learners who are waiting to learn from you.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={ctaAction}
              disabled={upgrading}
              className="inline-flex items-center gap-2.5 text-base font-bold text-purple-700 bg-white hover:bg-gray-50 px-10 py-4 rounded-xl shadow-2xl shadow-black/20 hover:shadow-black/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {ctaLabel}
              <ArrowRight size={18} />
            </button>

            {!user && (
              <button
                onClick={ctaLoginAction}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white border border-white/30 hover:border-white/60 px-6 py-3.5 rounded-xl transition-all duration-300"
              >
                Already a member? Sign in
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="bg-gray-950 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">LearnAI</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <Link to="/about" className="hover:text-gray-300 transition-colors">About</Link>
            <Link to="/features" className="hover:text-gray-300 transition-colors">Features</Link>
            <Link to="/tracks" className="hover:text-gray-300 transition-colors">Tracks</Link>
            <Link to="/insights" className="hover:text-gray-300 transition-colors">Insights</Link>
          </div>
          <p className="text-xs text-gray-600">&copy; 2026 LearnAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
