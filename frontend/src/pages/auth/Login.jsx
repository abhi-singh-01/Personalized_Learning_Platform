import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function Login() {
  usePageTitle('Sign In');
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('expired') === '1';
  const sessionEvicted = searchParams.get('reason') === 'session_expired';

  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name || 'Learner'}!`);
      nav(`/${user.role}/dashboard`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const googleBtnRef = useRef(null);

  // Initialize Google Sign-In once the GSI script is ready
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(initGoogle, 200);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setGLoading(true);
          try {
            const user = await googleLogin(response.credential);
            nav(`/${user.role}/dashboard`);
          } catch (err) {
            setError(err.response?.data?.message || 'Google login failed');
          } finally {
            setGLoading(false);
          }
        },
      });

      // Render the native button in a hidden container
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 300,
        });
      }
    };

    initGoogle();
  }, [googleLogin, nav]);

  const handleGoogleLogin = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured.');
      return;
    }
    // Click the hidden native Google button to trigger the popup
    const nativeBtn = googleBtnRef.current?.querySelector('div[role="button"]');
    if (nativeBtn) {
      nativeBtn.click();
    } else {
      setError('Google Sign-In is still loading. Please try again in a moment.');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0A0A0A]">

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left panel — animated gradient */}
        <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-blue-600 animate-gradient" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.12),transparent_50%)]" />

          {/* Floating shapes */}
          <div className="absolute top-20 left-16 w-32 h-32 rounded-full border border-white/10 animate-float" />
          <div className="absolute bottom-32 right-20 w-48 h-48 rounded-full border border-white/10 animate-float-slow" />
          <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-white/10 rounded-full animate-float" />
          <div className="absolute bottom-1/4 left-1/3 w-4 h-4 bg-white/15 rounded-full animate-float-slow" />

          <div className="relative z-10 text-white max-w-md animate-fade-in-up">
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm inline-block mb-8">
              <GraduationCap size={48} />
            </div>
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              Welcome Back to
              <br />
              <span className="text-white/90">LearnAI</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Your AI-powered learning companion. Adaptive quizzes, smart study
              plans, and real-time analytics to supercharge your education.
            </p>

            <div className="mt-10 flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-extrabold">10K+</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Learners</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-extrabold">98%</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Satisfaction</div>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <div className="text-2xl font-extrabold">4.9★</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — sign-in form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
          <div className="w-full max-w-md animate-fade-in-up">
            {/* Mobile-only branding */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden justify-center">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600">
                <GraduationCap size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                LearnAI
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                Sign in
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Enter your credentials to access your account
              </p>
            </div>

            {sessionExpired && (
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl mb-5 text-sm border border-amber-200 dark:border-amber-800/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                Your session expired due to inactivity. Please sign in again.
              </div>
            )}

            {sessionEvicted && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl mb-5 text-sm border border-blue-200 dark:border-blue-800/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                You were signed out because your account was logged in on another device (max 2 devices allowed).
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-800/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleLogin}
              disabled={gLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 mb-5 font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              {gLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>
            {/* Hidden native Google button */}
            <div ref={googleBtnRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }} />

            {/* Divider */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    className="input-field pl-11"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
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
                    className="input-field pl-11 pr-11"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
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
                className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign in
                  </>
                )}
              </button>
            </form>

            {/* Sign up link */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                New here?
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Sign up for free
              </Link>
            </p>

            <p className="text-center text-xs text-gray-400 mt-4">
              <Link to="/about" className="hover:underline">
                About this project
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}