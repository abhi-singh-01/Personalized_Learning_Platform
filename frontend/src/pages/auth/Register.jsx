import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Display-friendly role labels. */
const ROLES = [
  { value: 'learner', label: 'Learner', emoji: '🎓', desc: 'Learn, take quizzes, track progress' },
  { value: 'educator', label: 'Educator', emoji: '👨‍🏫', desc: 'Create courses, manage learners' },
];

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

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'learner' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { register, googleLogin } = useAuth();
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
    } finally {
      setLoading(false);
    }
  };

  const googleBtnRef = useRef(null);

  // Re-initialize Google Sign-In when role changes (so callback has latest role)
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
            const user = await googleLogin(response.credential, form.role);
            nav(`/${user.role}/dashboard`);
          } catch (err) {
            setError(err.response?.data?.message || 'Google sign-up failed');
          } finally {
            setGLoading(false);
          }
        },
      });

      // Render native button in hidden container
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          width: 300,
        });
      }
    };

    initGoogle();
  }, [googleLogin, nav, form.role]);

  const handleGoogleRegister = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured.');
      return;
    }
    const nativeBtn = googleBtnRef.current?.querySelector('div[role="button"]');
    if (nativeBtn) {
      nativeBtn.click();
    } else {
      setError('Google Sign-In is still loading. Please try again in a moment.');
    }
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0A0A0A]">
      <PublicNavbar />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Branding */}
          <div className="flex items-center gap-2.5 justify-center mb-8">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <GraduationCap size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Personalized Learning Platform
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
              Create account
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Join the platform and start learning
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-800/40 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            {/* Role selector — shown first for Google sign-up */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`py-3.5 px-4 rounded-xl border-2 text-left transition-all duration-200 ${form.role === r.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md shadow-blue-500/10'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                  >
                    <div className="text-lg mb-0.5">{r.emoji}</div>
                    <div className={`text-sm font-bold ${form.role === r.value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {r.label}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Google Sign-Up */}
            <button
              onClick={handleGoogleRegister}
              disabled={gLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 mb-5 font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              {gLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Sign up with Google
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Full Name
                </label>
                <input
                  className="input-field"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}