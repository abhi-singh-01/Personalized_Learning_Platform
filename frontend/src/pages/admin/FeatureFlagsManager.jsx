import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { ToggleLeft, ToggleRight, Plus, Edit2, Trash2, Zap, Users, Percent } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const DEFAULT_FORM = {
  name: '', description: '', isEnabled: false,
  enabledForRoles: [], rolloutPercentage: 100, metadata: '{}',
};

export default function FeatureFlagsManager() {
  usePageTitle('Feature Flags');
  const api = useApi();
  const [flags, setFlags] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const fetchFlags = async () => {
    try {
      const res = await api.get('/feature-flags');
      setFlags(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchFlags(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let metaJson = {};
      try { metaJson = JSON.parse(form.metadata); } catch { metaJson = {}; }

      const payload = {
        ...form,
        enabledForRoles: form.enabledForRoles || [],
        metadata: metaJson,
        rolloutPercentage: parseInt(form.rolloutPercentage) || 100,
      };

      if (editId) {
        await api.put(`/feature-flags/${editId}`, payload);
      } else {
        await api.post('/feature-flags', payload);
      }
      setShowForm(false);
      setEditId(null);
      setForm(DEFAULT_FORM);
      fetchFlags();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving flag');
    }
  };

  const handleToggle = async (flag) => {
    try {
      await api.put(`/feature-flags/${flag._id}`, { isEnabled: !flag.isEnabled });
      fetchFlags();
    } catch { /* silent */ }
  };

  const handleEdit = (flag) => {
    setForm({
      name: flag.name,
      description: flag.description || '',
      isEnabled: flag.isEnabled,
      enabledForRoles: flag.enabledForRoles || [],
      rolloutPercentage: flag.rolloutPercentage || 100,
      metadata: JSON.stringify(flag.metadata || {}, null, 2),
    });
    setEditId(flag._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feature flag?')) return;
    try { await api.del(`/feature-flags/${id}`); fetchFlags(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const toggleRole = (role) => {
    const current = form.enabledForRoles;
    setForm({
      ...form,
      enabledForRoles: current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role],
    });
  };

  if (api.loading && flags.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="text-yellow-500" /> Feature Flags
          </h1>
          <p className="text-sm text-gray-500 mt-1">Toggle features on/off for specific roles or users</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(DEFAULT_FORM); }}
          className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={16} /> New Flag
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold">{flags.length}</p>
          <p className="text-xs text-gray-500">Total Flags</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{flags.filter(f => f.isEnabled).length}</p>
          <p className="text-xs text-gray-500">Enabled</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-400">{flags.filter(f => !f.isEnabled).length}</p>
          <p className="text-xs text-gray-500">Disabled</p>
        </Card>
      </div>

      {/* Flags List */}
      <div className="space-y-3">
        {flags.length === 0 && <p className="text-gray-500 text-center py-8">No feature flags yet.</p>}
        {flags.map(flag => (
          <Card key={flag._id} className="!p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button onClick={() => handleToggle(flag)}
                  className={`transition-colors ${flag.isEnabled ? 'text-green-500' : 'text-gray-300'}`}>
                  {flag.isEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
                <div className="min-w-0">
                  <p className="font-semibold font-mono text-sm">{flag.name}</p>
                  {flag.description && <p className="text-xs text-gray-500 truncate">{flag.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {flag.enabledForRoles?.length > 0 && (
                      <span className="flex items-center gap-1"><Users size={12} /> {flag.enabledForRoles.join(', ')}</span>
                    )}
                    {flag.rolloutPercentage < 100 && (
                      <span className="flex items-center gap-1"><Percent size={12} /> {flag.rolloutPercentage}% rollout</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => handleEdit(flag)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(flag._id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editId ? 'Edit' : 'Create'} Feature Flag</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Flag Name</label>
                <input required className="input-field font-mono" placeholder="e.g. ai_quiz_generation" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={!!editId} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input className="input-field" placeholder="What does this flag control?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Enabled For Roles</label>
                <div className="flex gap-3 mt-1">
                  {['learner', 'educator', 'admin'].map(r => (
                    <label key={r} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={form.enabledForRoles.includes(r)} onChange={() => toggleRole(r)} className="rounded" />
                      <span className="text-sm capitalize">{r === 'educator' ? 'Educator' : r}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Leave empty to apply to all roles</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rollout Percentage</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={form.rolloutPercentage} onChange={e => setForm({ ...form, rolloutPercentage: e.target.value })} className="flex-1" />
                  <span className="text-sm font-bold w-12 text-right">{form.rolloutPercentage}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Metadata (JSON)</label>
                <textarea className="input-field font-mono text-sm" rows={3} value={form.metadata} onChange={e => setForm({ ...form, metadata: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isEnabled} onChange={e => setForm({ ...form, isEnabled: e.target.checked })} className="rounded" />
                <span className="text-sm font-medium">Enable this flag</span>
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
