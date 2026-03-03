import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      nav(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <PublicNavbar />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 justify-center mb-8">
            <GraduationCap size={32} className="text-primary-600" />
            <span className="text-2xl font-bold text-primary-600">Personalized Learning Platform</span>
          </div>
          <div className="card">
            <h2 className="text-2xl font-bold mb-2">Create account</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Join the platform and start learning</p>
            {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input className="input-field" placeholder="John Doe" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <input type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {['student', 'teacher'].map((r) => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
                      className={`py-3 rounded-lg border-2 text-sm font-medium capitalize transition-all ${form.role === r ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                      {r === 'student' ? '🎓' : '👨‍🏫'} {r}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Creating...' : 'Create account'}</button>
            </form>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}