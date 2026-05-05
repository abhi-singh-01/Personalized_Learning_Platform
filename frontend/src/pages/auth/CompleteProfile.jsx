import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowRight, Phone, MapPin, CheckCircle2 } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const locationData = {
  India: {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Saket'],
    'Uttar Pradesh': ['Lucknow', 'Noida', 'Kanpur', 'Agra', 'Varanasi', 'Ghaziabad'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot'],
    'Rajasthan': ['Jaipur', 'Udaipur', 'Jodhpur', 'Kota'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad'],
    'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar'],
    'Bihar': ['Patna', 'Gaya', 'Muzaffarpur'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Tirupati'],
  },
  'United States': {
    'California': ['Los Angeles', 'San Francisco', 'San Diego'],
    'New York': ['New York City', 'Buffalo', 'Albany'],
    'Texas': ['Houston', 'Dallas', 'Austin'],
    'Florida': ['Miami', 'Orlando', 'Tampa'],
  },
  'United Kingdom': {
    'England': ['London', 'Manchester', 'Birmingham'],
    'Scotland': ['Edinburgh', 'Glasgow'],
  },
  Canada: { 'Ontario': ['Toronto', 'Ottawa'], 'British Columbia': ['Vancouver', 'Victoria'], 'Quebec': ['Montreal'] },
  Australia: { 'New South Wales': ['Sydney'], 'Victoria': ['Melbourne'], 'Queensland': ['Brisbane'] },
  Singapore: { 'Singapore': ['Singapore'] },
  UAE: { 'Dubai': ['Dubai'], 'Abu Dhabi': ['Abu Dhabi'] },
};

const countries = Object.keys(locationData);

export default function CompleteProfile() {
  usePageTitle('Complete Profile');
  const { user } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ phone: '', country: '', state: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const statesForCountry = form.country ? Object.keys(locationData[form.country] || {}) : [];
  const citiesForState = form.country && form.state ? (locationData[form.country]?.[form.state] || []) : [];

  const updateField = (key, value) => {
    const updates = { ...form, [key]: value };
    if (key === 'country') { updates.state = ''; updates.city = ''; }
    if (key === 'state') { updates.city = ''; }
    setForm(updates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(form.phone)) { setError('Phone number must be exactly 10 digits'); return; }
    if (!form.country || !form.state || !form.city) { setError('All location fields are required'); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/complete-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      nav(`/${user?.role || 'learner'}/dashboard`);
    } catch (err) {
      setError(err.message || 'Failed to complete profile');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="fixed top-20 -left-20 w-72 h-72 bg-purple-200/40 dark:bg-purple-900/10 rounded-full blur-3xl" />
      <div className="fixed bottom-10 right-10 w-60 h-60 bg-blue-200/40 dark:bg-blue-900/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-lg shadow-purple-500/20">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">PLP</span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Almost done!</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Welcome{user?.name ? `, ${user.name}` : ''}! Complete your profile to get started.
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-800/40 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Country <span className="text-red-500">*</span></label>
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
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">State <span className="text-red-500">*</span></label>
                <select className="input-field appearance-none" value={form.state} onChange={(e) => updateField('state', e.target.value)} required disabled={!form.country}>
                  <option value="">Select state</option>
                  {statesForCountry.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">City <span className="text-red-500">*</span></label>
                <select className="input-field appearance-none" value={form.city} onChange={(e) => updateField('city', e.target.value)} required disabled={!form.state}>
                  <option value="">Select city</option>
                  {citiesForState.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-3 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl transition-all disabled:opacity-50">
              {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : <>Start Learning <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
