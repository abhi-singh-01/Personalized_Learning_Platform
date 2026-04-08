import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, Phone, MapPin } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
  usePageTitle('Sign Up');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', country: '', state: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const nav = useNavigate();

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
      const user = await register({ ...form, role: 'learner' });
      nav(`/${user.role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const init = () => {
      if (!window.google?.accounts?.id) { setTimeout(init, 200); return; }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setGLoading(true);
          try {
            const user = await googleLogin(response.credential, 'learner');
            nav(`/${user.role}/dashboard`);
          } catch (err) {
            setError(err.response?.data?.message || 'Google sign-up failed');
          } finally { setGLoading(false); }
        },
      });
      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, { type: 'standard', theme: 'outline', size: 'large', text: 'signup_with', width: 300 });
      }
    };
    init();
  }, [googleLogin, nav]);

  const handleGoogleRegister = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) { setError('Google Client ID is not configured.'); return; }
    const btn = googleBtnRef.current?.querySelector('div[role="button"]');
    if (btn) btn.click();
    else setError('Google Sign-In is still loading. Please try again.');
  }, []);

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
          <span className="text-xl font-bold text-gray-900 dark:text-white">LearnAI</span>
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Create your account</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Start learning for free — no credit card required</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-800/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogleRegister} disabled={gLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 mb-5">
            {gLoading ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <GoogleIcon />}
            Sign up with Google
          </button>
          <div ref={googleBtnRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, overflow: 'hidden' }} />

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Form */}
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

          <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-purple-600 dark:text-purple-400 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}