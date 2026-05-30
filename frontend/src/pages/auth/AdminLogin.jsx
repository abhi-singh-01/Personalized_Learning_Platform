import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Shield, Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, AlertTriangle, Sun, Moon } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import { adminDashboardPath } from '../../utils/rolePaths';
import { getAuthPortalRedirect } from '../../utils/authPortalRedirect';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const nav = useNavigate();
  const toast = useToast();
  usePageTitle('Admin Sign In');

  const redirectToMatchingPortal = useCallback((message) => {
    const redirect = getAuthPortalRedirect(message);
    if (!redirect) return false;
    toast.info(redirect.toast);
    nav(redirect.path, { replace: true });
    return true;
  }, [nav, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password, 'admin');
      toast.success('Welcome back, Administrator!');
      nav(adminDashboardPath(), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Sign in failed';
      if (redirectToMatchingPortal(msg)) return;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-gray-50 dark:bg-[#0A0A0A]">
      <div className="absolute top-4 right-4 z-20 sm:top-5 sm:right-5">
        <button
          type="button"
          onClick={toggle}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row lg:min-h-screen lg:min-h-[100dvh]">
        {/* Left panel — admin branding (desktop) */}
        <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative overflow-hidden items-center justify-center p-16 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-800 dark:from-slate-900 dark:via-gray-900 dark:to-zinc-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.12),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_40%,rgba(99,102,241,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(239,68,68,0.08),transparent_50%)]" />

          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />

          <div className="absolute top-20 left-16 w-32 h-32 rounded-full border border-white/10 animate-float" />
          <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full border border-white/10 animate-float-slow" />

          <div className="relative z-10 text-white max-w-md animate-fade-in-up">
            <div className="p-4 rounded-2xl bg-white/10 dark:bg-gradient-to-br dark:from-indigo-500/20 dark:to-red-500/10 backdrop-blur-sm border border-white/10 dark:border-white/5 inline-block mb-8">
              <Shield size={48} className="text-white dark:text-indigo-400" />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              Admin Console
              <br />
              <span className="text-white/90 dark:text-indigo-400/90">PLP Platform</span>
            </h1>
            <p className="text-lg text-white/70 dark:text-gray-400 leading-relaxed">
              Secure administrative access to manage users, courses, analytics,
              and platform settings. Authorized personnel only.
            </p>

            <div className="mt-10 flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-white dark:text-indigo-400">Full</div>
                <div className="text-xs text-white/50 dark:text-gray-500 uppercase tracking-wider">Control</div>
              </div>
              <div className="w-px h-10 bg-white/20 dark:bg-gray-700" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-white dark:text-emerald-400">256-bit</div>
                <div className="text-xs text-white/50 dark:text-gray-500 uppercase tracking-wider">Encrypted</div>
              </div>
              <div className="w-px h-10 bg-white/20 dark:bg-gray-700" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-white dark:text-amber-400">24/7</div>
                <div className="text-xs text-white/50 dark:text-gray-500 uppercase tracking-wider">Monitoring</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — admin login form */}
        <div className="flex-1 flex items-start justify-center w-full min-h-screen min-h-[100dvh] lg:min-h-0 px-4 pt-5 pb-8 sm:px-6 sm:pt-6 md:px-8 lg:px-10 xl:px-12 lg:pt-10 lg:pb-12">
          <div className="w-full max-w-md animate-fade-in-up">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Homepage
            </Link>

            <div className="flex items-center gap-2.5 mb-8 lg:hidden justify-center">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-500/30">
                <Shield size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                PLP Admin
              </span>
            </div>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 mb-4">
                <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Administrator Access</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                Admin Sign In
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Enter your administrator credentials to access the control panel
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/15 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed">
                This page is for authorized administrators only. Unauthorized access attempts are logged and monitored.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-500/20">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
                {error.toLowerCase().includes('educator sign in') && (
                  <Link to="/educator/login" className="mt-2 inline-flex text-sm font-semibold text-indigo-600 dark:text-indigo-300 hover:underline">
                    Open educator sign in →
                  </Link>
                )}
                {error.toLowerCase().includes('learner sign in') && (
                  <Link to="/login" className="mt-2 inline-flex text-sm font-semibold text-indigo-600 dark:text-indigo-300 hover:underline">
                    Open learner sign in →
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    placeholder="admin@plp.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={show ? 'text' : 'password'}
                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all duration-200"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-600 mt-8">
              <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                ← Homepage
              </Link>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Learner Sign In
              </Link>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <Link to="/educator/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Educator Sign In
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                SSL Secured
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                Audit Logged
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-600">
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
