import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import {
  GraduationCap, ArrowRight, LogIn, Brain, Crosshair, CalendarCheck,
  ChevronDown, ChevronUp, Sparkles, Cpu, Users, BookOpen, Clock, Zap,
} from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const aiSteps = [
  { num: '01', icon: Brain, title: 'Cognitive profiling', desc: 'PLP observes your quiz responses, time-on-task, and error patterns to build a cognitive model unique to you.' },
  { num: '02', icon: Crosshair, title: 'Weak-spot targeting', desc: 'The AI identifies micro-skills you struggle with and generates focused drills to close each gap.' },
  { num: '03', icon: CalendarCheck, title: 'Living study plan', desc: 'Your daily plan recalibrates every session — adding review for fading memories and new content when you are ready.' },
];

const demoPanels = [
  {
    id: 'twin', label: 'Cognitive Twin', icon: Brain,
    color: 'from-blue-500 to-cyan-400',
    content: 'Your twin mirrors how you think. After 3 quizzes, PLP can predict which question types will trip you up — and serves preventive micro-lessons before you even see them on an exam.',
    stat: '87%', statLabel: 'prediction accuracy after 5 sessions',
  },
  {
    id: 'weakspot', label: 'Weak-Spot Detector', icon: Crosshair,
    color: 'from-purple-500 to-pink-400',
    content: 'The detector breaks every topic into 10–30 micro-skills and monitors each independently. When one drops below threshold, a targeted drill is auto-inserted into your plan.',
    stat: '3.2×', statLabel: 'faster weak-spot resolution vs self-study',
  },
  {
    id: 'planner', label: 'Study Plan Generator', icon: CalendarCheck,
    color: 'from-emerald-500 to-teal-400',
    content: 'Tell PLP your exam date and daily time budget. It generates a spaced-repetition plan that adapts in real time — rescheduling tasks you missed and celebrating streaks you keep.',
    stat: '94%', statLabel: 'of learners hit their target date',
  },
];

const stats = [
  { value: '38K', label: 'AI study hours per day', icon: Clock },
  { value: '12,840', label: 'Active learners', icon: Users },
  { value: '4.9/5', label: 'Avg. course rating', icon: Sparkles },
  { value: '120+', label: 'Guided pathways', icon: BookOpen },
];

const faqs = [
  { q: 'How does PLP personalise content?', a: 'PLP builds a cognitive model from your quiz results, time-on-task, and error patterns. This model adjusts difficulty, content order, and revision timing every session.' },
  { q: 'Is my data used to train AI models?', a: 'No. Your learning data is used exclusively to personalise your experience. We never share or use it for external model training.' },
  { q: 'Can educators see individual learner insights?', a: 'Yes. Educators get a co-pilot dashboard showing class-wide and per-learner analytics, but only for learners enrolled in their courses.' },
  { q: 'What makes PLP different from other LMS platforms?', a: 'Most LMS platforms deliver the same content to everyone. PLP dynamically generates quizzes, adjusts difficulty, and builds a living study plan unique to each learner.' },
  { q: 'Does PLP work on mobile?', a: 'Yes. The entire platform is fully responsive and works on any device — phone, tablet, or desktop.' },
];

export default function Insights() {
  usePageTitle('Insights');
  const { dark } = useTheme();
  const [activeDemo, setActiveDemo] = useState('twin');
  const [openFaq, setOpenFaq] = useState(null);

  const currentDemo = demoPanels.find((d) => d.id === activeDemo);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050509] overflow-hidden font-sans selection:bg-blue-500/30">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative pt-12 pb-12 px-6 lg:pt-16 lg:pb-16 overflow-hidden">
        <div className="pointer-events-none">
          <div className="absolute -top-20 right-1/4 w-80 h-80 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-20 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-float-slow" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 mb-6 border border-cyan-100 dark:border-cyan-800/50">
            <Cpu size={14} className="text-cyan-600 dark:text-cyan-400" />
            <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-[0.22em]">AI-POWERED INTELLIGENCE</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-5 leading-[1.05]">
            See how AI{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-500 dark:from-cyan-400 dark:via-blue-400 dark:to-indigo-400 animate-gradient">powers your learning</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Under the hood, PLP combines cognitive science, generative AI, and real-time analytics to build a learning experience that evolves with you.
          </p>
        </div>
      </section>

      {/* How AI Works — Steps */}
      <section className="py-12 px-6 bg-gray-50/90 dark:bg-gray-950/40">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-14 text-center">How the AI engine works</h2>
          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-14 left-[12%] right-[12%] h-px bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-200 dark:from-cyan-800 dark:via-blue-800 dark:to-indigo-800" />
            {aiSteps.map((s, i) => (
              <div key={s.num} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600 text-white mb-4 shadow-lg shadow-cyan-500/25">
                  <s.icon size={24} />
                </div>
                <div className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.22em] mb-2">Step {s.num}</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">{s.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Panels */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-10 text-center">Try the demo panels</h2>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {demoPanels.map((d) => (
              <button key={d.id} onClick={() => setActiveDemo(d.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeDemo === d.id ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 dark:bg-gray-900/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
                <d.icon size={16} /> {d.label}
              </button>
            ))}
          </div>
          {currentDemo && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-8 animate-fade-in-up">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${currentDemo.color} shadow-lg mb-4`}>
                    <currentDemo.icon size={22} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{currentDemo.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{currentDemo.content}</p>
                </div>
                <div className="shrink-0 w-44 h-44 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{currentDemo.stat}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 text-center mt-2 px-3 leading-tight">{currentDemo.statLabel}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stat Counters */}
      <section className="py-10 px-6 bg-gray-50/90 dark:bg-gray-950/40">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center group">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 mb-3 group-hover:scale-110 transition-transform duration-300">
                <s.icon size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-10 text-center">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden transition-all">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900/60 transition-colors">
                  <span>{f.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-gray-400 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed animate-fade-in-up">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-10 md:p-14 text-center animate-gradient shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Experience AI-powered learning</h2>
              <p className="text-sm md:text-base text-white/80 mb-8 max-w-xl mx-auto">Create a free account and let PLP's AI engine build your personalized path from the very first session.</p>
              <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-white hover:bg-gray-50 px-7 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <LogIn size={18} /> Get started free <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-950 py-12 px-6 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600"><GraduationCap size={18} className="text-white" /></div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">PLP</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">&copy; 2026 Personalized Learning Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
