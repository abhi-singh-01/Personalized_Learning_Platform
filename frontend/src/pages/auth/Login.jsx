import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      nav(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex flex-col md:flex-row">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-900 items-center justify-center p-12">
          <div className="text-white max-w-md">
            <GraduationCap size={64} className="mb-6" />
            <h1 className="text-4xl font-bold mb-4">Welcome to Personalized Learning Platform</h1>
            <p className="text-lg text-primary-100">Your AI-powered personalized learning companion. Adaptive quizzes, smart study plans, and real-time analytics to supercharge your education.</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <GraduationCap size={32} className="text-primary-600" />
              <span className="text-2xl font-bold text-primary-600">Personalized Learning Platform</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Sign in</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Enter your credentials to access your account</p>
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input type={show ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account? <Link to="/register" className="text-primary-600 font-medium hover:underline">Sign up</Link>
            </p>
            <p className="text-center text-sm text-gray-400 mt-3">
              <Link to="/about" className="hover:underline">About this project</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}