import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import usePageTitle from '../hooks/usePageTitle';
import useApi from '../hooks/useApi';
import {
  GraduationCap, ArrowRight, Users, Brain, Globe, TrendingUp,
  DollarSign, BarChart3, Video, BookOpen, Star, CheckCircle2,
  Zap, Shield, Award, ChevronRight, Play, Sparkles,
} from 'lucide-react';

const stats = [
  { value: '12,840+', label: 'Active Learners', icon: Users },
  { value: '97%', label: 'Revenue Share', icon: DollarSign },
  { value: '120+', label: 'Educators', icon: GraduationCap },
  { value: '4.8★', label: 'Avg Rating', icon: Star },
];

const benefits = [
  { icon: TrendingUp, title: 'Earn on your terms', desc: 'Set your own course prices. Keep up to 97% revenue on every sale with transparent fee structure.', color: 'from-emerald-500 to-teal-500' },
  { icon: Users, title: 'Reach thousands of learners', desc: 'Tap into our growing community of 12,000+ active learners hungry for quality content.', color: 'from-blue-500 to-cyan-500' },
  { icon: Brain, title: 'AI-powered teaching tools', desc: 'Our AI auto-generates quizzes, creates study plans, identifies at-risk learners, and provides instant feedback.', color: 'from-purple-500 to-violet-500' },
  { icon: Globe, title: 'Teach globally', desc: 'Your courses reach students worldwide. Built-in analytics show you exactly how learners engage.', color: 'from-amber-500 to-orange-500' },
  { icon: Video, title: 'Live lectures built-in', desc: 'Host live classes, record sessions, and schedule lectures — all from your educator dashboard.', color: 'from-rose-500 to-pink-500' },
  { icon: BarChart3, title: 'Deep analytics', desc: 'Track revenue, engagement, quiz scores, and learner progress with real-time dashboards.', color: 'from-indigo-500 to-blue-500' },
];

const steps = [
  { num: '01', title: 'Sign up for free', desc: 'Create your account in 30 seconds. No upfront fees, no commitments.' },
  { num: '02', title: 'Create your first course', desc: 'Upload videos, PDFs, notes. Our editor makes it easy. AI helps generate quizzes.' },
  { num: '03', title: 'Publish & earn', desc: 'Set your price, publish your course, and start earning as learners enroll.' },
];

const testimonials = [
  { name: 'Prof. Rajesh Kumar', role: 'ML Instructor · 2,300 learners', text: 'I earned ₹4.2L in my first 6 months. The AI quiz generator saves me hours every week.', avatar: '👨‍🏫' },
  { name: 'Sneha Patel', role: 'Full-Stack Dev · 1,800 learners', text: 'The live lecture feature is amazing. I run weekly sessions and the recording feature means learners never miss out.', avatar: '👩‍💻' },
  { name: 'Dr. Amit Sharma', role: 'Data Science · 3,100 learners', text: 'Best platform for Indian educators. The analytics dashboard tells me exactly where my students struggle.', avatar: '👨‍🔬' },
];

export default function BecomeEducator() {
  usePageTitle('Become an Educator');
  const { user } = useAuth();
  const api = useApi();
  const nav = useNavigate();
  const [upgrading, setUpgrading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpgradeRole = async () => {
    if (!user) { nav('/register'); return; }
    if (user.role === 'educator') { nav('/educator/dashboard'); return; }

    setUpgrading(true);
    try {
      // Call backend to upgrade role
      await api.put('/auth/upgrade-to-educator');
      setShowSuccess(true);
      setTimeout(() => {
        window.location.href = '/educator/dashboard';
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const ctaAction = () => {
    if (!user) nav('/register');
    else if (user.role === 'educator') nav('/educator/dashboard');
    else handleUpgradeRole();
  };

  const ctaLabel = !user ? 'Sign up & start teaching' : user.role === 'educator' ? 'Go to Educator Dashboard' : 'Start teaching today';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <PublicNavbar />

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome, Educator! 🎉</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Your account has been upgraded. Redirecting to your educator dashboard...</p>
            <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.1),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
              <Sparkles size={14} className="text-purple-400" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">Become an Educator</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              Come teach with us.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400">
                Impact millions.
              </span>
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-xl leading-relaxed">
              Join 120+ educators who are building their online teaching business on LearnAI. Get AI-powered tools, instant analytics, and access to thousands of motivated learners.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button onClick={ctaAction} disabled={upgrading}
                className="inline-flex items-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 px-8 py-4 rounded-full shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                {upgrading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {ctaLabel} <ArrowRight size={18} />
              </button>
              <Link to="/features" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                <Play size={16} /> See how it works
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <s.icon size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-white">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-16 px-4 lg:px-6 bg-gray-50/80 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Start in 3 simple steps</h2>
            <p className="text-gray-500 dark:text-gray-400">No technical skills needed. We handle the platform, you focus on teaching.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                {i < 2 && <div className="hidden md:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-transparent dark:from-purple-700 z-0" style={{ width: '60%', left: '70%' }} />}
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-7 hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all z-10">
                  <span className="text-4xl font-extrabold text-purple-100 dark:text-purple-900">{step.num}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BENEFITS GRID ═══════════ */}
      <section className="py-16 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Why educators choose LearnAI</h2>
            <p className="text-gray-500 dark:text-gray-400">Everything you need to build a successful teaching business</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(b => (
              <div key={b.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-7 hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${b.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <b.icon size={26} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-16 px-4 lg:px-6 bg-gray-50/80 dark:bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Hear from our educators</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />)}
                </div>
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

      {/* ═══════════ WHAT YOU GET ═══════════ */}
      <section className="py-16 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Your educator dashboard includes</h2>
              <div className="space-y-4">
                {[
                  { icon: BookOpen, text: 'Course builder with video, PDF, and note uploads' },
                  { icon: Brain, text: 'AI-powered quiz generator (MCQ, subjective, coding)' },
                  { icon: Video, text: 'Live lecture scheduling and recording' },
                  { icon: BarChart3, text: 'Real-time learner analytics and performance tracking' },
                  { icon: Shield, text: 'Coupon and discount management' },
                  { icon: DollarSign, text: 'Revenue dashboard with payout tracking' },
                  { icon: Zap, text: 'At-risk learner alerts and engagement scoring' },
                  { icon: Award, text: 'Report exporter (PDF) for class performance' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 mt-0.5 shrink-0">
                      <item.icon size={16} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 via-violet-50 to-blue-100 dark:from-purple-900/20 dark:via-violet-900/20 dark:to-blue-900/20 rounded-3xl p-8 flex items-center justify-center min-h-[350px]">
              <div className="text-center">
                <div className="text-7xl mb-4">🎓</div>
                <p className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ready to inspire?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">Join 120+ educators already making an impact on LearnAI</p>
                <button onClick={ctaAction} disabled={upgrading}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 px-6 py-3 rounded-full shadow-lg shadow-purple-500/25 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                  {ctaLabel} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="py-16 px-4 lg:px-6 bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Start your teaching journey today</h2>
          <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
            It's free to get started — create your first course and reach thousands of eager learners.
          </p>
          <button onClick={ctaAction} disabled={upgrading}
            className="inline-flex items-center gap-2 text-base font-semibold text-purple-700 bg-white hover:bg-gray-50 px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5 disabled:opacity-50">
            {ctaLabel} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 py-8 px-4 text-center">
        <p className="text-xs text-gray-500">&copy; 2026 LearnAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
