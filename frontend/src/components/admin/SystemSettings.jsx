import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { Settings, Save, AlertTriangle, Key } from 'lucide-react';

export default function SystemSettings() {
    const api = useApi();
    const [settings, setSettings] = useState({
        siteName: 'Personalized Learning Platform',
        maintenanceMode: false,
        aiEnabled: true,
        geminiApiKey: ''
    });

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data) {
                setSettings(res.data);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.put('/admin/settings', settings);
            alert('Settings saved securely.');
        } catch (err) {
            alert(err.message || 'Error saving settings');
        }
    };

    if (api.loading && !settings._id) return <Loading />;

    return (
        <div className="space-y-6 max-w-4xl">
            <Card>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Settings size={20} className="text-primary-600" /> General Configuration
                </h2>
                <form onSubmit={handleSave} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-1">Site Name</label>
                            <input
                                type="text"
                                className="input-field"
                                value={settings.siteName}
                                onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Displayed in the header and emails.</p>
                        </div>

                        <div className="flex flex-col justify-center">
                            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                    checked={settings.maintenanceMode}
                                    onChange={e => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                />
                                <div>
                                    <p className="font-medium flex items-center gap-2">Maintenance Mode {settings.maintenanceMode && <AlertTriangle size={16} className="text-yellow-500" />}</p>
                                    <p className="text-xs text-gray-500">Block non-admins from logging in.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <hr className="border-gray-200 dark:border-gray-700" />

                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Key size={20} className="text-purple-600" /> AI Features & API Key
                    </h2>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-6 border border-purple-100 dark:border-purple-800 text-sm text-purple-800 dark:text-purple-300">
                        <strong>Security Notice:</strong> The Gemini API Key below is stored in the database. When blank, the system falls back to the server's `.env` configuration.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col justify-center">
                            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                    checked={settings.aiEnabled}
                                    onChange={e => setSettings({ ...settings, aiEnabled: e.target.checked })}
                                />
                                <div>
                                    <p className="font-medium">Enable AI Generation</p>
                                    <p className="text-xs text-gray-500">Allow teachers to generate content via AI.</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Gemini API Key</label>
                            <input
                                type="password"
                                className="input-field placeholder:text-sm"
                                placeholder="Leave blank to use server .env"
                                value={settings.geminiApiKey}
                                onChange={e => setSettings({ ...settings, geminiApiKey: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={api.loading} className="btn-primary flex items-center gap-2">
                            <Save size={18} /> Save All Settings
                        </button>
                    </div>

                </form>
            </Card>
        </div>
    );
}
