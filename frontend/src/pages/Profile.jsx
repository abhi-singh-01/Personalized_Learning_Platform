import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import Card from '../components/ui/Card';
import { levelColors } from '../utils/helpers';
import { Monitor, Trash2, User, Lock, Save } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';

export default function Profile() {
  usePageTitle('Profile');
  const { user, refreshUser } = useAuth();
  const api = useApi();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    dailyGoalMinutes: user?.preferences?.dailyGoalMinutes || 30,
  });
  const [pw, setPw] = useState({
    currentPassword: '',
    newPassword: '',
    confirm: '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.data?.sessions || []);
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (tab === 'sessions') loadSessions();
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/users/profile', {
        name: form.name,
        bio: form.bio,
        preferences: { dailyGoalMinutes: form.dailyGoalMinutes },
      });
      await refreshUser();
      setMsg('Profile updated successfully!');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Update failed');
    }
    setSaving(false);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      setMsg('Passwords do not match');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      await api.put('/users/change-password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setMsg('Password changed successfully!');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const revokeSession = async (sessionId) => {
    setMsg('');
    try {
      await api.del(`/auth/sessions/${sessionId}`);
      setMsg('Session revoked successfully!');
      await loadSessions();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to revoke session');
    }
  };

  const revokeOtherSessions = async () => {
    setMsg('');
    try {
      await api.del('/auth/sessions');
      setMsg('Other sessions revoked successfully!');
      await loadSessions();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile Settings</h1>

      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl font-bold text-primary-700 dark:text-primary-300">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs capitalize px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {user?.role}
              </span>
              {user?.role === 'learner' && user?.aiLevel && (
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded ' +
                    (levelColors[user.aiLevel] || '')
                  }
                >
                  {user.aiLevel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => {
              setTab('profile');
              setMsg('');
            }}
            className={
              'pb-2 px-3 text-sm font-medium border-b-2 transition-colors ' +
              (tab === 'profile'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700')
            }
          >
            <User size={16} className="inline mr-1" /> Profile
          </button>
          <button
            onClick={() => {
              setTab('password');
              setMsg('');
            }}
            className={
              'pb-2 px-3 text-sm font-medium border-b-2 transition-colors ' +
              (tab === 'password'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700')
            }
          >
            <Lock size={16} className="inline mr-1" /> Password
          </button>
          <button
            onClick={() => {
              setTab('sessions');
              setMsg('');
            }}
            className={
              'pb-2 px-3 text-sm font-medium border-b-2 transition-colors ' +
              (tab === 'sessions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700')
            }
          >
            <Monitor size={16} className="inline mr-1" /> Sessions
          </button>
        </div>

        {msg && (
          <div
            className={
              'px-4 py-2 rounded-lg mb-4 text-sm ' +
              (msg.includes('success')
                ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600')
            }
          >
            {msg}
          </div>
        )}

        {tab === 'profile' ? (
          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Name</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Bio</label>
              <textarea
                className="input-field h-20 resize-none"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Daily Study Goal (minutes)
              </label>
              <input
                type="number"
                className="input-field w-32"
                min={5}
                max={480}
                value={form.dailyGoalMinutes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dailyGoalMinutes: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : tab === 'password' ? (
          <form onSubmit={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                className="input-field"
                value={pw.currentPassword}
                onChange={(e) =>
                  setPw({ ...pw, currentPassword: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                New Password
              </label>
              <input
                type="password"
                className="input-field"
                value={pw.newPassword}
                onChange={(e) =>
                  setPw({ ...pw, newPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                className="input-field"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Lock size={16} /> {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Active devices</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review where your account is signed in.</p>
              </div>
              <button
                type="button"
                onClick={revokeOtherSessions}
                className="btn-secondary text-sm"
              >
                Revoke others
              </button>
            </div>

            {loadingSessions ? (
              <p className="text-sm text-gray-500">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-gray-500">No active sessions found.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {session.deviceInfo || 'Unknown device'}
                        {session.isCurrent && <span className="ml-2 text-xs text-green-600 dark:text-green-400">Current</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">IP: {session.ipAddress || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last active: {session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : 'Unknown'}
                      </p>
                    </div>
                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => revokeSession(session.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Revoke session"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}