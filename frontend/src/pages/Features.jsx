import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import {
  Brain,
  BarChart3,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  LogIn,
  Zap,
  ShieldCheck,
  RefreshCw,
  GraduationCap,
  Target,
  LineChart,
  BookOpen,
  MessageSquare,
} from 'lucide-react';

const coreFeatures = [
  {
    icon: Brain,
    title: 'Cognitive Twin Engine',
    tagline: 'Your learning mirror',
    detail:
      'PLP builds an evolving model of how you learn — your pace, preferred format, and retention curve. It then uses this cognitive twin to curate lessons, flashcards, and challenge sets that sit right at the edge of your ability.',
    color: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/20',
    bullets: [
      'Adaptive difficulty that shifts in real time',
      'Personalized content sequencing',
      'Retention-based spaced repetition',
    ],
  },
  {
    icon: BarChart3,
    title: 'Deep Progress Intelligence',
    tagline: 'See every skill clearly',
    detail:
      'Go beyond a single progress bar. Our granular skill maps break your knowledge into micro-skills, detect weak spots early, and compute readiness scores for exams, certifications, or job interviews.',
    color: 'from-purple-500 to-pink-400',
    shadow: 'shadow-purple-500/20',
    bullets: [
      'Micro-skill breakdown per topic',
      'Weak-spot detection with fix suggestions',
      'Exam & interview readiness scores',
    ],
  },
  {
    icon: Award,
    title: 'Educator Co-Pilot',
    tagline: 'Empower educators',
    detail:
      'Educators get an AI assistant that drafts quizzes, rubrics, and personalized feedback in seconds. Spend less time on admin and more time on mentoring.',
    color: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/20',
    bullets: [
      'One-click quiz & rubric generation',
      'AI-drafted feedback per learner',
      'Class-wide insight dashboards',
    ],
  },
  {
    icon: Zap,
    title: 'Instant AI Feedback',
    tagline: 'Learn from every attempt',
    detail:
      'After each quiz or assignment, PLP generates detailed explanations, highlights misconceptions, and links you to targeted micro-lessons — so mistakes become learning moments.',
    color: 'from-amber-500 to-orange-400',
    shadow: 'shadow-amber-500/20',
    bullets: [
      'Line-by-line misconception analysis',
      'Linked remedial micro-lessons',
      'Progress-aware difficulty ramp',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Private',
    tagline: 'Your data stays yours',
    detail:
      'End-to-end encryption, role-based access, and GDPR-aligned practices ensure your learning data is protected. Only you control who sees your progress.',
    color: 'from-rose-500 to-red-400',
    shadow: 'shadow-rose-500/20',
    bullets: [
      'Role-based access control',
      'Encrypted data at rest and in transit',
      'Transparent privacy dashboard',
    ],
  },
  {
    icon: RefreshCw,
    title: 'Continuous Adaptation',
    tagline: 'Always evolving',
    detail:
      'PLP doesn\'t set it and forget it. The platform continuously recalibrates your study plan based on new quiz results, time spent, and confidence signals — every single session.',
    color: 'from-indigo-500 to-violet-400',
    shadow: 'shadow-indigo-500/20',
    bullets: [
      'Session-by-session recalibration',
      'Confidence signal tracking',
      'Auto-adjusted study schedules',
    ],
  },
];

const comparisons = [
  {
    aspect: 'Content delivery',
    before: 'One-size-fits-all video lectures',
    after: 'Adaptive micro-lessons tailored to your level',
  },
  {
    aspect: 'Assessment',
    before: 'Static quizzes with fixed questions',
    after: 'AI-generated questions that target weak spots',
  },
  {
    aspect: 'Study planning',
    before: 'Manual scheduling, easy to fall behind',
    after: 'Living plan that adjusts to your daily progress',
  },
  {
    aspect: 'Feedback',
    before: 'Grade with no explanation',
    after: 'Detailed misconception analysis with remedial links',
  },
  {
    aspect: 'Educator workload',
    before: 'Hours creating rubrics and feedback',
    after: 'AI co-pilot drafts everything in seconds',
  },
];

const skillBars = [
  { label: 'Algorithms', pct: 72, color: 'bg-blue-500' },
  { label: 'Web Dev', pct: 91, color: 'bg-emerald-500' },
  { label: 'Databases', pct: 58, color: 'bg-purple-500' },
  { label: 'System Design', pct: 45, color: 'bg-pink-500' },
  { label: 'AI / ML', pct: 83, color: 'bg-amber-500' },
];

export default function Features() {
  const { dark } = useTheme();
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050509] overflow-hidden font-sans selection:bg-blue-500/30">
      <PublicNavbar />

      {/* ─── Hero ─── */}
      <section className="relative pt-12 pb-12 px-6 lg:pt-16 lg:pb-16 overflow-hidden">
        <div className="pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 mb-6 border border-purple-100 dark:border-purple-800/50">
            <Sparkles size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-[0.22em]">
              PLATFORM CAPABILITIES
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-5 leading-[1.05]">
            Every feature designed to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 dark:from-purple-400 dark:via-blue-400 dark:to-cyan-300 animate-gradient">
              accelerate your learning
            </span>
          </h1>

          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            PLP combines cognitive science, generative AI, and educator expertise into
            a single loop that keeps upgrading itself — and you.
          </p>
        </div>
      </section>

      {/* ─── Expandable Feature Cards ─── */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-12 text-center">
            Tap a feature to explore
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {coreFeatures.map((f, i) => (
              <div
                key={f.title}
                className={`group relative rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:${f.shadow} ${
                  expanded === i ? 'ring-2 ring-blue-500/40' : ''
                }`}
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} shadow-lg ${f.shadow} shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <f.icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                          {f.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {f.tagline}
                        </p>
                      </div>
                      {expanded === i ? (
                        <ChevronUp size={18} className="text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400 shrink-0" />
                      )}
                    </div>

                    {expanded === i && (
                      <div className="mt-4 animate-fade-in-up">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                          {f.detail}
                        </p>
                        <ul className="space-y-2">
                          {f.bullets.map((b) => (
                            <li
                              key={b}
                              className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Before vs After Comparison ─── */}
      <section className="py-12 px-6 bg-gray-50/90 dark:bg-gray-950/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Traditional learning vs PLP
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              See the difference at a glance.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-gray-100 dark:bg-gray-900/80">
              <div className="px-5 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em]">
                Aspect
              </div>
              <div className="px-5 py-3 text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-[0.18em]">
                Before
              </div>
              <div className="px-5 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.18em]">
                With PLP
              </div>
            </div>

            {comparisons.map((c, i) => (
              <div
                key={c.aspect}
                className={`grid grid-cols-[1fr_1fr_1fr] ${
                  i % 2 === 0
                    ? 'bg-white dark:bg-gray-950'
                    : 'bg-gray-50/80 dark:bg-gray-900/40'
                } border-t border-gray-100 dark:border-gray-800/50`}
              >
                <div className="px-5 py-4 text-sm font-semibold text-gray-800 dark:text-white">
                  {c.aspect}
                </div>
                <div className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                  {c.before}
                </div>
                <div className="px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  {c.after}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Interactive Skill Map ─── */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Live skill confidence map
            </h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
              This is what your personal skill radar looks like inside PLP. Every bar
              updates after each quiz or assignment.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 space-y-5">
            {skillBars.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">
                    {s.label}
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {s.pct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${s.pct}%`, animation: 'grow-bar 1.2s ease-out forwards' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 p-10 md:p-14 text-center animate-gradient shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                Ready to experience every feature?
              </h2>
              <p className="text-sm md:text-base text-white/80 mb-8 max-w-xl mx-auto">
                Create a free account and let PLP build your personalized learning
                experience from day one.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm md:text-base font-semibold text-blue-600 bg-white hover:bg-gray-50 px-7 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                <LogIn size={18} />
                Get started free
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-100 dark:bg-gray-950 py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">PLP</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            &copy; 2026 Personalized Learning Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
