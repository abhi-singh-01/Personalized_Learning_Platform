import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, Phone, MapPin, Mail, RotateCcw } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import { roleHomeSegment } from '../../utils/rolePaths';
import { getAuthPortalRedirect } from '../../utils/authPortalRedirect';

const locationData = {
  India: {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Lajpat Nagar'],
    'Uttar Pradesh': ['Lucknow', 'Noida', 'Kanpur', 'Agra', 'Varanasi', 'Ghaziabad'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
    'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota', 'Ajmer'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'],
    'Bihar': ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati', 'Guntur'],
  },
  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
    'New York': ['New York City', 'Buffalo', 'Albany', 'Rochester'],
    'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
    'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
    'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Bellevue'],
  },
  'United Kingdom': {
    'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds'],
    'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'],
    'Wales': ['Cardiff', 'Swansea', 'Newport'],
  },
  Canada: {
    'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton'],
    'British Columbia': ['Vancouver', 'Victoria', 'Surrey'],
    'Quebec': ['Montreal', 'Quebec City', 'Laval'],
    'Alberta': ['Calgary', 'Edmonton', 'Red Deer'],
  },
  Australia: {
    'New South Wales': ['Sydney', 'Newcastle', 'Wollongong'],
    'Victoria': ['Melbourne', 'Geelong', 'Ballarat'],
    'Queensland': ['Brisbane', 'Gold Coast', 'Cairns'],
  },
  Germany: {
    'Bavaria': ['Munich', 'Nuremberg', 'Augsburg'],
    'Berlin': ['Berlin'],
    'Hamburg': ['Hamburg'],
  },
  Singapore: { 'Singapore': ['Singapore'] },
  UAE: { 'Dubai': ['Dubai'], 'Abu Dhabi': ['Abu Dhabi'], 'Sharjah': ['Sharjah'] },
};

const countries = Object.keys(locationData);

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
  const [searchParams] = useSearchParams();
  const isEducatorFlow = searchParams.get('role') === 'educator';
  usePageTitle(isEducatorFlow ? 'Educator Sign Up' : 'Sign Up');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '', state: '', city: '' });
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { register, verifyEmailOtp, resendEmailOtp, googleLogin } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  useEffect(() => {
    setError('');
    setVerificationEmail('');
    setOtp('');
  }, [isEducatorFlow]);

  const redirectToMatchingPortal = useCallback((message) => {
    const redirect = getAuthPortalRedirect(message, isEducatorFlow ? 'educator' : 'learner');
    if (!redirect) return false;
    toast.info(redirect.toast);
    nav(redirect.path, { replace: true });
    return true;
  }, [isEducatorFlow, nav, toast]);

  const statesForCountry = form.country ? Object.keys(locationData[form.country] || {}) : [];
  const citiesForState = form.country && form.state ? (locationData[form.country]?.[form.state] || []) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(form.phone)) { setError('Phone number must be exactly 10 digits'); return; }
    if (!form.country) { setError('Please select your country'); return; }
    if (!form.state) { setError('Please select your state'); return; }
    if (!form.city) { setError('Please select your city'); return; }

    setLoading(true);
    try {
      const selectedRole = isEducatorFlow ? 'educator' : 'learner';
      const result = await register({ ...form, role: selectedRole });
      if (result?.verificationRequired) {
        setVerificationEmail(result.email || form.email);
        toast.success('Verification code sent to your email');
        return;
      }
      const user = result;
      toast.success(isEducatorFlow ? 'Educator account created! Welcome aboard 🎉' : 'Account created successfully! Welcome aboard 🎉');
      nav(`/${roleHomeSegment(user.role || selectedRole)}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (redirectToMatchingPortal(msg)) return;
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const cleanOtp = otp.replace(/\D/g, '').slice(0, 6);
    if (cleanOtp.length !== 6) { setError('Enter the 6-digit verification code'); return; }

    setLoading(true);
    try {
      const selectedRole = isEducatorFlow ? 'educator' : 'learner';
      const user = await verifyEmailOtp(verificationEmail, cleanOtp, selectedRole);
      toast.success('Email verified successfully');
      nav(`/${roleHomeSegment(user.role || selectedRole)}/dashboard`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
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
    } finally { setResendLoading(false); }
  };

  const handleGoogleCredential = useCallback(
    async (credential) => {
      setError('');
      const selectedRole = isEducatorFlow ? 'educator' : 'learner';
      try {
        const user = await googleLogin(credential, selectedRole);
        toast.success(isEducatorFlow ? 'Educator account ready — welcome!' : 'Welcome — your account is ready!');
        nav(`/${roleHomeSegment(user.role || selectedRole)}/dashboard`, { replace: true });
      } catch (err) {
        const msg = err.response?.data?.message || 'Google sign-in failed';
        if (redirectToMatchingPortal(msg)) return;
        setError(msg);
        toast.error(msg);
      }
    },
    [googleLogin, isEducatorFlow, nav, redirectToMatchingPortal, toast]
  );

  const updateField = (key, value) => {
    const updates = { ...form, [key]: value };
    if (key === 'country') { updates.state = ''; updates.city = ''; }
    if (key === 'state') { updates.city = ''; }
    setForm(updates);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="fixed top-20 -left-20 w-72 h-72 bg-purple-200/40 dark:bg-purple-900/10 rounded-full blur-3xl" />
      <div className="fixed bottom-10 right-10 w-60 h-60 bg-blue-200/40 dark:bg-blue-900/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <Link to="/" className="flex items-center gap-2.5 justify-center mb-8 group">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">PLP</span>
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
          {isEducatorFlow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/40 mb-4">
              <GraduationCap size={14} className="text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Educator Account</span>
            </div>
          )}
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">
            {isEducatorFlow ? 'Create your educator account' : 'Create your account'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {verificationEmail
              ? 'Enter the code sent to your email to activate your account'
              : (isEducatorFlow ? 'Start teaching and earning — free to get started' : 'Start learning for free — no credit card required')}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-800/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> {error}
            </div>
          )}

          {verificationEmail ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/40 p-4 flex gap-3">
                <Mail size={20} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Check your inbox</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{verificationEmail}</p>
                </div>
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

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all disabled:opacity-50">
                {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</> : <>Verify email <ArrowRight size={18} /></>}
              </button>

              <button type="button" onClick={handleResendOtp} disabled={resendLoading}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 py-3 rounded-xl transition-colors disabled:opacity-50">
                <RotateCcw size={16} />
                {resendLoading ? 'Sending...' : 'Resend code'}
              </button>
            </form>
          ) : (
            <>
              <div className="mb-5">
                <GoogleSignInButton
                  key={isEducatorFlow ? 'educator' : 'learner'}
                  mode="signup"
                  onCredential={handleGoogleCredential}
                  onGsiError={(msg) => setError(msg)}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  {(busy) =>
                    busy ? (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <>
                        <GoogleIcon />
                        Sign up with Google
                      </>
                    )
                  }
                </GoogleSignInButton>
              </div>

              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
              <input className="input-field" placeholder="John Doe" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input type="password" className="input-field" placeholder="Min 6 characters" value={form.password} onChange={(e) => updateField('password', e.target.value)} required minLength={6} />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" className="input-field pl-10" placeholder="10-digit mobile number"
                  value={form.phone} onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required maxLength={10} />
                <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium ${form.phone.length === 10 ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {form.phone.length}/10
                </span>
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Country <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select className="input-field pl-10 appearance-none" value={form.country} onChange={(e) => updateField('country', e.target.value)} required>
                  <option value="">Select country</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* State & City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  State <span className="text-red-500">*</span>
                </label>
                <select className="input-field appearance-none" value={form.state} onChange={(e) => updateField('state', e.target.value)} required disabled={!form.country}>
                  <option value="">Select state</option>
                  {statesForCountry.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  City <span className="text-red-500">*</span>
                </label>
                <select className="input-field appearance-none" value={form.city} onChange={(e) => updateField('city', e.target.value)} required disabled={!form.state}>
                  <option value="">Select city</option>
                  {citiesForState.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all disabled:opacity-50">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : <>Sign up <ArrowRight size={18} /></>}
            </button>
              </form>
            </>
          )}

          <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Already have an account?{' '}
          <Link to={isEducatorFlow ? '/login?role=educator' : '/login'} className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}