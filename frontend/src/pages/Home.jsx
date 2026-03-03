import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PublicNavbar from '../components/layout/PublicNavbar';
import {
  GraduationCap,
  Brain,
  BarChart3,
  BookOpen,
  Users,
  Zap,
  Target,
  TrendingUp,
  Shield,
  Play,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Clock,
  Award,
  BookUser,
  Lightbulb,
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const { dark } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0A0A] overflow-hidden font-sans selection:bg-blue-500/30">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 px-6 lg:pt-20 lg:pb-20">
        <div className="relative max-w-7xl mx-auto z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="animate-fade-in-up text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 mb-8 border border-blue-100 dark:border-blue-800">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Now powered by Gemini AI
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.1]">
              Personalized Learning <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500 dark:from-blue-400 dark:to-purple-400">
                Powered by AI
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-normal max-w-2xl mx-auto lg:mx-0">
              Experience adaptive study plans, real-time tutoring, and smart performance tracking built for modern education.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            </div>
          </div>

          <div className="relative w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 lg:animate-fade-in-up mt-12 lg:mt-0">
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop" alt="Students studying together" className="w-full h-auto aspect-video object-cover" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-6 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              Why Choose Personalized Learning Platform?
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Built for students and teachers who want smarter education.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
              <Brain className="text-blue-600 mb-4" size={24} />
              <h3 className="text-lg font-bold text-blue-600 mb-2">AI Study Plans</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Adaptive study paths generated based on your strengths and weaknesses.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
              <BarChart3 className="text-purple-600 mb-4" size={24} />
              <h3 className="text-lg font-bold text-blue-600 mb-2">Performance Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Track progress with smart analytics dashboards powered by AI.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
              <Award className="text-emerald-600 mb-4" size={24} />
              <h3 className="text-lg font-bold text-blue-600 mb-2">Real-time Tutoring</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Get instant help with AI-driven explanations and feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111827] text-white py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={24} className="text-white" />
              <span className="text-xl font-bold text-white">
                Personalized Learning Platform
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Empowering personalized learning through advanced Artificial Intelligence.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-white">Platform</h4>
            <ul className="space-y-3 t ext-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Courses</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI Analysis</a></li>
              <li><a href="#" className="hover:text-white transition-colors">For Teachers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-white">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <p>&copy; 2026 Personalized Learning Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg></a>
            <a href="#" className="hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg></a>
            <a href="#" className="hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
}