import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft, RotateCcw } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { roleHomeSegment, isLearnerRole, isEducatorRole } from '../../utils/rolePaths';

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
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { login, googleLogin, verifyEmailOtp, resendEmailOtp } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionEvicted = searchParams.get('reason') === 'session_expired';
  const isEducatorFlow = searchParams.get('role') === 'educator';
  const portalRole = isEducatorFlow ? 'educator' : 'learner';
  usePageTitle(isEducatorFlow ? 'Educator Sign In' : 'Sign In');

  const toast = useToast();

  useEffect(() => {
    setError('');
    setVerificationEmail('');
    setOtp('');
  }, [isEducatorFlow]);

  const redirectToMatchingPortal = useCallback((message) => {
    const lower = String(message || '').toLowerCase();
    if (!isEducatorFlow && lower.includes('educator sign in')) {
      toast.info('This email belongs to an educator account. Opening educator sign in…');
      nav('/login?role=educator', { replace: true });
      return true;
    }
    if (isEducatorFlow && lower.includes('learner account')) {
      toast.info('This email belongs to a learner account. Opening learner sign in…');
      nav('/login', { replace: true });
      return true;
    }
    return false;
  }, [isEducatorFlow, nav, toast]);

  const redirectAfterLogin = useCallback((user) => {
    if (user.role === 'admin') {
      toast.success('Welcome back, Administrator!');
      nav('/admin/dashboard', { replace: true });
    } else if (isEducatorFlow && isLearnerRole(user.role)) {
      setError('This learner account cannot access the educator portal. Switch to educator from your account first.');
    } else {
      const greeting = isEducatorRole(user.role) ? 'Educator' : (user.name || 'Learner');
      toast.success(`Welcome back, ${greeting}!`);
      nav(`/${roleHomeSegment(user.role)}/dashboard`, { replace: true });
    }
  }, [isEducatorFlow, nav, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password, portalRole);
      redirectAfterLogin(user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Sign in failed';
      if (redirectToMatchingPortal(msg)) return;
      if (err.response?.status === 403 && msg.toLowerCase().includes('verify')) {
        setVerificationEmail(form.email);
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setError('');
      try {
        const user = await googleLogin(credential, portalRole);
        redirectAfterLogin(user);
      } catch (err) {
        const msg = err.response?.data?.message || 'Google sign-in failed';
        if (redirectToMatchingPortal(msg)) return;
        setError(msg);
        toast.error(msg);
      }
    },
    [googleLogin, portalRole, redirectAfterLogin, redirectToMatchingPortal, toast]
  );

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const cleanOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) { setError('Enter the 6-digit verification code'); return; }

    setLoading(true);
    try {
      const user = await verifyEmailOtp(verificationEmail, cleanOtp, portalRole);
      toast.success('Email verified successfully');
      redirectAfterLogin(user);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      await resendEmailOtp(verificationEmail);
      toast.success('A new verification code was sent');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not resend the code';
      setError(msg);
      toast.error(msg);
    } finally {
      setResendLoading(false);
    }
  };

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
              <span className="text-white/90">PLP</span>
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
            {/* Back to Homepage */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to Homepage
            </Link>

            {/* Mobile-only branding */}
            <div className="flex items-center gap-2.5 mb-10 lg:hidden justify-center">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600">
                <GraduationCap size={24} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                PLP
              </span>
            </div>

            <div className="mb-8">
              {isEducatorFlow && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/40 mb-4">
                  <GraduationCap size={14} className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Educator Sign In</span>
                </div>
              )}
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                {isEducatorFlow ? 'Sign in as Educator' : 'Sign in as Learner'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {isEducatorFlow
                  ? 'Access your educator dashboard and start teaching'
                  : 'Access your learner dashboard and courses'}
              </p>
            </div>

            {sessionEvicted && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl mb-5 text-sm border border-blue-200 dark:border-blue-800/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                You were signed out because your account was logged in on another device (max 2 devices allowed).
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-800/40">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
                {!isEducatorFlow && error.toLowerCase().includes('educator sign in') && (
                  <Link
                    to="/login?role=educator"
                    className="mt-2 inline-flex text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline"
                  >
                    Open educator sign in →
                  </Link>
                )}
                {isEducatorFlow && error.toLowerCase().includes('learner account') && (
                  <Link
                    to="/login"
                    className="mt-2 inline-flex text-sm font-semibold text-purple-700 dark:text-purple-300 hover:underline"
                  >
                    Open learner sign in →
                  </Link>
                )}
              </div>
            )}

            {verificationEmail ? (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40 p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Verify your email</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{verificationEmail}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">6-digit OTP</label>
                  <input
                    className="input-field text-center text-lg font-semibold tracking-[0.4em]"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Verify and sign in
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  {resendLoading ? 'Sending...' : 'Resend code'}
                </button>
              </form>
            ) : (
              <>
                {/* Google Sign-In */}
                <div className="mb-5">
                  <GoogleSignInButton
                    key={portalRole}
                    mode="signin"
                    onCredential={handleGoogleCredential}
                    onGsiError={(msg) => setError(msg)}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
                  >
                    {(busy) =>
                      busy ? (
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <>
                          <GoogleIcon />
                          Continue with Google
                        </>
                      )
                    }
                  </GoogleSignInButton>
                </div>

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
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </form>
              </>
            )}

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
                to={isEducatorFlow ? '/register?role=educator' : '/register'}
                className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                {isEducatorFlow ? 'Create educator account' : 'Sign up for free'}
              </Link>
            </p>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-3">
              {isEducatorFlow ? 'Using a learner account?' : 'Are you an educator?'}{' '}
              <Link
                to={isEducatorFlow ? '/login?role=learner' : '/login?role=educator'}
                className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                {isEducatorFlow ? 'Sign in as learner' : 'Sign in as educator'}
              </Link>
            </p>

            <div className="flex items-center justify-center gap-3 text-xs text-gray-400 mt-4">
              <Link to="/" className="hover:text-purple-500 hover:underline transition-colors">
                ← Homepage
              </Link>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <Link to="/about" className="hover:text-purple-500 hover:underline transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}