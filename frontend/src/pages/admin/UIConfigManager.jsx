import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import {
  Layout, Plus, Edit2, Trash2, Eye, EyeOff, BarChart3,
  Image, MessageSquare, Megaphone, ChevronDown, ChevronUp,
  Monitor, Copy, Search, Filter
} from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { unwrapApiData } from '../../utils/apiData';

const SCREEN_OPTIONS = ['home', 'courses', 'checkout', 'dashboard', 'global'];
const TYPE_OPTIONS = ['banner', 'carousel', 'popup', 'strip', 'modal', 'section', 'announcement'];

const TYPE_COLORS = {
  banner: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  carousel: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  popup: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  strip: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  modal: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  section: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  announcement: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const DEFAULT_FORM = {
  key: '', screen: 'home', type: 'banner', title: '', description: '',
  content: '{}', targetRoles: ['all'], priority: 0, isActive: true,
  startsAt: '', expiresAt: '',
};

export default function UIConfigManager() {
  usePageTitle('UI Configuration');
  const api = useApi();
  const [configs, setConfigs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [filterScreen, setFilterScreen] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterScreen) params.set('screen', filterScreen);
      if (filterType) params.set('type', filterType);
      const res = await api.get(`/ui-config?${params.toString()}`);
      const list = unwrapApiData(res);
      setConfigs(Array.isArray(list) ? list : []);
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/ui-config/analytics');
      setAnalytics(unwrapApiData(res));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [filterScreen, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let contentJson = {};
      try { contentJson = JSON.parse(form.content); } catch { contentJson = {}; }

      const payload = {
        ...form,
        content: contentJson,
        priority: parseInt(form.priority) || 0,
      };

      if (editId) {
        await api.put(`/ui-config/${editId}`, payload);
      } else {
        await api.post('/ui-config', payload);
      }
      setShowForm(false);
      setEditId(null);
      setForm(DEFAULT_FORM);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving config');
    }
  };

  const handleEdit = (config) => {
    setForm({
      key: config.key,
      screen: config.screen,
      type: config.type,
      title: config.title || '',
      description: config.description || '',
      content: JSON.stringify(config.content || {}, null, 2),
      targetRoles: config.targetRoles || ['all'],
      priority: config.priority || 0,
      isActive: config.isActive,
      startsAt: config.startsAt ? config.startsAt.slice(0, 16) : '',
      expiresAt: config.expiresAt ? config.expiresAt.slice(0, 16) : '',
    });
    setEditId(config._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this UI config?')) return;
    try { await api.del(`/ui-config/${id}`); fetchData(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleToggle = async (config) => {
    try {
      await api.put(`/ui-config/${config._id}`, { isActive: !config.isActive });
      fetchData();
    } catch { /* silent */ }
  };

  const filteredConfigs = configs.filter(c =>
    !search || c.key?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (api.loading && configs.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="text-primary-600" /> UI Config Manager
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control banners, popups, announcements — all from here</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAnalytics(!showAnalytics); if (!analytics) fetchAnalytics(); }}
            className="btn-secondary flex items-center gap-1 text-sm">
            <BarChart3 size={16} /> Analytics
          </button>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(DEFAULT_FORM); }}
            className="btn-primary flex items-center gap-1 text-sm">
            <Plus size={16} /> New Config
          </button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <Card>
          <h3 className="font-semibold mb-3">BDUI Analytics (All Time)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{analytics.totals.totalImpressions.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Impressions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{analytics.totals.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Clicks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{analytics.totals.ctr}%</p>
              <p className="text-xs text-gray-500">CTR</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search by key or title..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={filterScreen} onChange={e => setFilterScreen(e.target.value)}>
          <option value="">All Screens</option>
          {SCREEN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-field w-auto" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Config List */}
      <div className="space-y-3">
        {filteredConfigs.length === 0 && <p className="text-gray-500 text-center py-8">No UI configs found. Create one to get started!</p>}
        {filteredConfigs.map(config => (
          <Card key={config._id} className="!p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[config.type] || 'bg-gray-100'}`}>{config.type}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{config.screen}</span>
                  {!config.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>}
                  <span className="text-xs text-gray-400">Priority: {config.priority}</span>
                </div>
                <p className="font-semibold mt-1 truncate">{config.title || config.key}</p>
                <p className="text-xs text-gray-400 font-mono">{config.key}</p>
                {config.description && <p className="text-sm text-gray-500 mt-1">{config.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>👁 {config.impressions || 0} impressions</span>
                  <span>🖱 {config.clicks || 0} clicks</span>
                  {config.expiresAt && <span>⏰ Expires: {new Date(config.expiresAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleToggle(config)} className={`p-2 rounded-lg transition-colors ${config.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`} title={config.isActive ? 'Deactivate' : 'Activate'}>
                  {config.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => handleEdit(config)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(config._id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editId ? 'Edit' : 'Create'} UI Config</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Key (unique)</label>
                  <input required className="input-field" placeholder="e.g. home_hero_banner" value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} disabled={!!editId} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Screen</label>
                  <select className="input-field" value={form.screen} onChange={e => setForm({ ...form, screen: e.target.value })}>
                    {SCREEN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <input type="number" className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input className="input-field" placeholder="Display title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input className="input-field" placeholder="Internal description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content (JSON)</label>
                <textarea className="input-field font-mono text-sm" rows={6} placeholder='{"imageUrl": "...", "buttonText": "Shop Now"}' value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Starts At</label>
                  <input type="datetime-local" className="input-field" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expires At</label>
                  <input type="datetime-local" className="input-field" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={api.loading} className="btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
