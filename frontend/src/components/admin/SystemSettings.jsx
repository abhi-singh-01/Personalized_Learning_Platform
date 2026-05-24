import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { Save } from 'lucide-react';

export default function SystemSettings() {
  const api = useApi();
  const [settings, setSettings] = useState({
    siteName: 'Personalized Learning Platform',
    maintenanceMode: false,
    aiEnabled: true,
    geminiApiKey: '',
  });

  useEffect(() => {
    api.get('/admin/settings').then((res) => {
      if (res.data) setSettings(res.data);
    }).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', settings);
      alert('Settings saved.');
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not save');
    }
  };

  if (api.loading && !settings._id) return <Loading />;

  return (
    <Card className="max-w-xl">
      <h2 className="text-lg font-bold mb-4">Platform Settings</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Site name</label>
          <input
            type="text"
            className="input-field"
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            required
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={settings.maintenanceMode}
            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
          />
          <span className="text-sm">Maintenance mode (only admins can sign in)</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={settings.aiEnabled}
            onChange={(e) => setSettings({ ...settings, aiEnabled: e.target.checked })}
          />
          <span className="text-sm">Enable AI features</span>
        </label>

        <div>
          <label className="block text-sm font-medium mb-1">Gemini API key (optional)</label>
          <input
            type="password"
            className="input-field"
            placeholder="Uses server .env if empty"
            value={settings.geminiApiKey}
            onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
          />
        </div>

        <button type="submit" disabled={api.loading} className="btn-primary flex items-center gap-2">
          <Save size={18} /> Save
        </button>
      </form>
    </Card>
  );
}
