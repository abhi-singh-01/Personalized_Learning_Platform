import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import {
  GraduationCap, ArrowRight, LogIn, Clock, Users, Code, Database,
  Briefcase, Layers, Star, CheckCircle2,
} from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

const categories = ['All', 'Data & AI', 'Web Development', 'Career'];

const allTracks = [
  {
    id: 'ml-foundations', category: 'Data & AI', title: 'Machine Learning Foundations',
    subtitle: 'From linear regression to neural networks', icon: Database,
    color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20',
    duration: '8 weeks', level: 'Beginner', difficulty: 40, enrolled: '2,340', rating: 4.8,
    weeks: [
      { w: 1, t: 'Python data stack & NumPy' }, { w: 2, t: 'Supervised learning basics' },
      { w: 3, t: 'Regression & classification' }, { w: 4, t: 'Decision trees & ensembles' },
      { w: 5, t: 'Neural network fundamentals' }, { w: 6, t: 'Model evaluation & tuning' },
      { w: 7, t: 'Capstone project sprint' }, { w: 8, t: 'Portfolio review & certification' },
    ],
  },
  {
    id: 'genai-mastery', category: 'Data & AI', title: 'Generative AI Mastery',
    subtitle: 'Prompt engineering, RAG, and fine-tuning', icon: Layers,
    color: 'from-purple-500 to-pink-400', shadow: 'shadow-purple-500/20',
    duration: '6 weeks', level: 'Intermediate', difficulty: 65, enrolled: '1,870', rating: 4.9,
    weeks: [
      { w: 1, t: 'LLM foundations & tokenization' }, { w: 2, t: 'Prompt engineering patterns' },
      { w: 3, t: 'Retrieval-augmented generation' }, { w: 4, t: 'Fine-tuning with LoRA' },
      { w: 5, t: 'Building AI agents' }, { w: 6, t: 'Production deployment' },
    ],
  },
  {
    id: 'fullstack-react', category: 'Web Development', title: 'Full-Stack React Engineering',
    subtitle: 'React, Node.js, and production deployment', icon: Code,
    color: 'from-emerald-500 to-teal-400', shadow: 'shadow-emerald-500/20',
    duration: '10 weeks', level: 'Beginner → Advanced', difficulty: 55, enrolled: '3,120', rating: 4.7,
    weeks: [
      { w: 1, t: 'Modern JavaScript & ES6+' }, { w: 2, t: 'React fundamentals & hooks' },
      { w: 3, t: 'State management & routing' }, { w: 4, t: 'Tailwind CSS & responsive design' },
      { w: 5, t: 'Node.js & Express APIs' }, { w: 6, t: 'MongoDB & data modeling' },
      { w: 7, t: 'Auth & authorization' }, { w: 8, t: 'Testing & CI/CD' },
      { w: 9, t: 'Performance & SEO' }, { w: 10, t: 'Capstone: deploy a SaaS app' },
    ],
  },
  {
    id: 'api-design', category: 'Web Development', title: 'API Design & Architecture',
    subtitle: 'REST, GraphQL, and microservices', icon: Code,
    color: 'from-amber-500 to-orange-400', shadow: 'shadow-amber-500/20',
    duration: '5 weeks', level: 'Intermediate', difficulty: 60, enrolled: '980', rating: 4.6,
    weeks: [
      { w: 1, t: 'RESTful API best practices' }, { w: 2, t: 'GraphQL schema & resolvers' },
      { w: 3, t: 'Auth & rate limiting' }, { w: 4, t: 'Microservices patterns' },
      { w: 5, t: 'API docs & testing' },
    ],
  },
  {
    id: 'interview-prep', category: 'Career', title: 'Technical Interview Bootcamp',
    subtitle: 'DS&A, system design, and behavioral prep', icon: Briefcase,
    color: 'from-rose-500 to-red-400', shadow: 'shadow-rose-500/20',
    duration: '4 weeks', level: 'Any level', difficulty: 70, enrolled: '4,560', rating: 4.9,
    weeks: [
      { w: 1, t: 'Arrays, strings, hash maps' }, { w: 2, t: 'Trees, graphs, DP' },
      { w: 3, t: 'System design fundamentals' }, { w: 4, t: 'Behavioral + mock interviews' },
    ],
  },
  {
    id: 'portfolio-builder', category: 'Career', title: 'Portfolio & Personal Brand',
    subtitle: 'Build a portfolio that gets callbacks', icon: Briefcase,
    color: 'from-indigo-500 to-violet-400', shadow: 'shadow-indigo-500/20',
    duration: '3 weeks', level: 'Any level', difficulty: 30, enrolled: '1,240', rating: 4.8,
    weeks: [
      { w: 1, t: 'Project selection & storytelling' }, { w: 2, t: 'Portfolio site design' },
      { w: 3, t: 'LinkedIn, GitHub, CV optimization' },
    ],
  },
];

export default function Tracks() {
  usePageTitle('Learning Tracks');
  const { dark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredTrack, setHoveredTrack] = useState(null);

  const filtered = activeCategory === 'All' ? allTracks : allTracks.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-white dark:bg-[#050509] overflow-hidden font-sans selection:bg-blue-500/30">
      <PublicNavbar />

      {/* Hero */}
      <section className="relative pt-12 pb-12 px-6 lg:pt-16 lg:pb-16 overflow-hidden">
        <div className="pointer-events-none">
          <div className="absolute -top-24 left-1/3 w-80 h-80 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-10 w-72 h-72 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-3xl animate-float-slow" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 mb-6 border border-emerald-100 dark:border-emerald-800/50">
            <Layers size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-[0.22em]">GUIDED LEARNING PATHS</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-5 leading-[1.05]">
            Choose a track,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-300 animate-gradient">master a skill</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Each track is AI-curated with adaptive pacing, weekly milestones, and real-world projects. Hover over any card to preview the curriculum.
          </p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="px-6 pb-8">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-3">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${activeCategory === cat ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-100 dark:bg-gray-900/70 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'}`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Track Cards */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((track) => {
            const isHovered = hoveredTrack === track.id;
            const barColor = track.difficulty <= 40 ? 'bg-emerald-500' : track.difficulty <= 65 ? 'bg-amber-500' : 'bg-rose-500';
            return (
              <article key={track.id}
                className={`group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-blue-500/50 hover:-translate-y-1`}
                onMouseEnter={() => setHoveredTrack(track.id)} onMouseLeave={() => setHoveredTrack(null)}>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${track.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <track.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{track.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{track.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 mb-4">
                    <span className="inline-flex items-center gap-1"><Clock size={12} />{track.duration}</span>
                    <span className="inline-flex items-center gap-1"><Users size={12} />{track.enrolled}</span>
                    <span className="inline-flex items-center gap-1"><Star size={12} className="text-amber-400" />{track.rating}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Difficulty</span>
                      <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">{track.level}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${track.difficulty}%` }} />
                    </div>
                  </div>
                  {isHovered && (
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in-up">
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.18em] mb-2">Week-by-week</p>
                      <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {track.weeks.map((wk) => (
                          <li key={wk.w} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            <span className="font-semibold text-gray-800 dark:text-white w-8 shrink-0">W{wk.w}</span>
                            {wk.t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <Link to="/register"
                  className="mt-5 inline-flex items-center justify-center gap-2 w-full text-xs font-semibold text-blue-50 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/25 hover:shadow-lg transition-all duration-300">
                  Start this track <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 p-10 md:p-14 text-center animate-gradient shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">Can't decide? Let AI pick for you</h2>
              <p className="text-sm md:text-base text-white/80 mb-8 max-w-xl mx-auto">Sign up and take a 5-minute assessment. PLP will recommend the perfect track based on your goals.</p>
              <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 bg-white hover:bg-gray-50 px-7 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                <LogIn size={18} /> Take the assessment <ArrowRight size={16} />
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
