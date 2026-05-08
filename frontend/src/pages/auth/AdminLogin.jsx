import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, AlertTriangle } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  usePageTitle('Admin Sign In');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== 'admin') {
        // Not an admin — show error and don't proceed
        setError('Access denied. This login is for platform administrators only.');
        toast.error('Access denied — not an admin account.');
        // Log them out silently since they shouldn't be here
        return;
      }
      toast.success('Welcome back, Administrator!');
      nav('/admin/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Sign in failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* Left panel — dark admin branding */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center p-16">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(239,68,68,0.08),transparent_50%)]" />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Floating shapes */}
          <div className="absolute top-20 left-16 w-32 h-32 rounded-full border border-indigo-500/10 animate-float" />
          <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full border border-red-500/10 animate-float-slow" />
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-indigo-500/20 rounded-full animate-float" />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-amber-500/20 rounded-full animate-float-slow" />

          <div className="relative z-10 text-white max-w-md animate-fade-in-up">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-red-500/10 backdrop-blur-sm border border-white/5 inline-block mb-8">
              <Shield size={48} className="text-indigo-400" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              Admin Console
              <br />
              <span className="text-indigo-400/90">PLP Platform</span>
            </h1>
            <p className="text-lg text-gray-400 leading-relaxed">
              Secure administrative access to manage users, courses, analytics,
              and platform settings. Authorized personnel only.
            </p>

            <div className="mt-10 flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-indigo-400">Full</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Control</div>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-emerald-400">256-bit</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Encrypted</div>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-amber-400">24/7</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Monitoring</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — admin login form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Back to Homepage */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-400 mb-6 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Homepage
            </Link>

            {/* Mobile-only branding */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden justify-center">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-500/30">
                <Shield size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                PLP Admin
              </span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                <Shield size={14} className="text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Administrator Access</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-2">
                Admin Sign In
              </h2>
              <p className="text-gray-500">
                Enter your administrator credentials to access the control panel
              </p>
            </div>

            {/* Security notice */}
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-400/80 leading-relaxed">
                This page is for authorized administrators only. Unauthorized access attempts are logged and monitored.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-500/20 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            {/* Admin login form — NO Google sign-in */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-900 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    placeholder="admin@plp.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={show ? 'text' : 'password'}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-gray-900 border-2 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 py-3 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/30"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign in to Admin Panel
                  </>
                )}
              </button>
            </form>

            {/* Footer links — no signup */}
            <div className="flex items-center justify-center gap-3 text-xs text-gray-600 mt-8">
              <Link to="/" className="hover:text-indigo-400 transition-colors">
                ← Homepage
              </Link>
              <span className="text-gray-700">·</span>
              <Link to="/login" className="hover:text-indigo-400 transition-colors">
                Learner / Educator Login
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                SSL Secured
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                Audit Logged
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                Role Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
