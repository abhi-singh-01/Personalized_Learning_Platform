import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import usePageTitle from '../../hooks/usePageTitle';

export default function ResetPassword() {
  usePageTitle('Reset Password');
  const [params] = useSearchParams();
  const { resetPassword, forgotPassword } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: params.get('email') || '',
    otp: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ email: form.email, otp: form.otp, password: form.password });
      toast.success('Password reset successfully. Please sign in.');
      nav('/login', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Password reset failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setResending(true);
    try {
      await forgotPassword(form.email);
      toast.success('A new reset code was sent');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not resend code';
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6">
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Enter reset code</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Use the 6-digit code from your email and choose a new password.</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm border border-red-100 dark:border-red-800/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className="input-field pl-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">6-digit code</label>
            <input
              className="input-field text-center text-lg font-semibold tracking-[0.4em]"
              inputMode="numeric"
              placeholder="000000"
              value={form.otp}
              onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              required
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="input-field pl-11"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm password</label>
            <input
              type="password"
              className="input-field"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading}
            className="w-full text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 py-3 rounded-xl shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50">
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
          <button type="button" onClick={resendCode} disabled={resending || !form.email}
            className="w-full text-sm font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 py-3 rounded-xl transition-colors disabled:opacity-50">
            {resending ? 'Sending...' : 'Resend code'}
          </button>
        </form>
      </div>
    </div>
  );
}
