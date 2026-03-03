import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ArrowLeft } from 'lucide-react';

const developers = [
  { name: 'Abhishek Mishra', role: 'Full-Stack Lead', desc: 'Architected the system and led integration across all modules.', email: 'abhishek@learnai.dev', initials: 'AM', color: 'from-indigo-500 to-violet-500' },
  { name: 'Anand Patel', role: 'Backend Developer', desc: 'Built the REST API, database models, and authentication layer.', email: 'anand@learnai.dev', initials: 'AP', color: 'from-emerald-500 to-teal-500' },
  { name: 'Alok Kumar', role: 'Frontend Developer', desc: 'Designed and implemented the React UI and data visualizations.', email: 'alok@learnai.dev', initials: 'AK', color: 'from-orange-500 to-rose-500' },
  { name: 'Abhijeet Singh', role: 'AI/ML Engineer', desc: 'Integrated Gemini AI and built the personalization engine.', email: 'abhijeet@learnai.dev', initials: 'AS', color: 'from-cyan-500 to-blue-500' },
];

const techStack = ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Google Gemini AI', 'Tailwind CSS', 'JWT Auth', 'Recharts'];

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <GraduationCap size={28} /> Personalized Learning Platform
          </Link>
          <Link to="/login" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-8">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-violet-600 bg-clip-text text-transparent">
            About Personalized Learning Platform
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            An AI-powered personalized learning platform that adapts to each student and provides real-time analytics for both students and teachers.
          </p>
        </div>

        <div className="card mb-12">
          <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Personalized Learning Platform bridges the gap between traditional learning management systems and truly personalized education.
            By leveraging Google Gemini AI, the platform classifies students into adaptive levels, generates targeted
            quizzes, creates custom study plans, and provides actionable insights.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Key features include role-based access control, real-time analytics dashboards, streak tracking,
            engagement scoring, adaptive difficulty adjustment, and AI-generated feedback built with
            production-ready architecture.
          </p>
        </div>

        <div className="card mb-12">
          <h2 className="text-2xl font-bold mb-6">Technologies Used</h2>
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <span key={tech} className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-8 text-center">Meet the Developers</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {developers.map((dev) => (
              <div key={dev.name} className="card flex gap-4 items-start">
                <div className={'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ' + dev.color}>
                  {dev.initials}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{dev.name}</h3>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">{dev.role}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dev.desc}</p>
                  <a href={'mailto:' + dev.email} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-primary-600 mt-2">
                    <Mail size={14} /> {dev.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}