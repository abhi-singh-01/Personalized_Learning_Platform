import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import { levelColors, formatDate } from '../../utils/helpers';
import { Users, Search } from 'lucide-react';

import { UserPlus } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function LearnerAnalytics() {
  usePageTitle('Learner Analytics');
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [assignedLearners, setAssignedLearners] = useState([]);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newLearner, setNewLearner] = useState({ name: '', email: '', password: '' });

  const fetchData = async () => {
    try {
      const res = await api.get('/courses/teaching');
      setCourses(res.data || []);
      // Fetch educator's specific assigned learners and merge them in
      const meRes = await api.get('/auth/me');
      setAssignedLearners(meRes.data?.assignedLearners || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLearner = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/learner', newLearner);
      setShowAddModal(false);
      setNewLearner({ name: '', email: '', password: '' });
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.message || 'Error adding learner');
    }
  };

  if (api.loading && courses.length === 0) return <Loading />;

  const allLearners = [];
  const seen = new Set();
  courses.forEach((c) => {
    (c.learners || []).forEach((s) => {
      if (!seen.has(s._id)) {
        seen.add(s._id);
        allLearners.push(s);
      }
    });
  });

  // Also display learners directly assigned to the educator
  assignedLearners.forEach(s => {
    if (s && !seen.has(s._id)) {
      seen.add(s._id);
      allLearners.push(s);
    }
  });

  const filtered = allLearners.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold">Learner Analytics</h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-10 w-64" placeholder="Search learners..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <UserPlus size={18} /> Add Learner
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No learners found" icon={Users} description="Add learners or wait for them to enroll in your courses." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Learner</th>
                  <th className="pb-3 font-medium">AI Level</th>
                  <th className="pb-3 font-medium">Avg Score</th>
                  <th className="pb-3 font-medium">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-2">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </td>
                    <td className="py-3">
                      <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (levelColors[s.aiLevel] || levelColors.Beginner)}>
                        {s.aiLevel || 'Beginner'}
                      </span>
                    </td>
                    <td className="py-3">{s.averageScore ?? 0}%</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: (s.engagementScore || 0) + '%' }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{s.engagementScore || 0}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Learner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><UserPlus size={20} className="text-primary-600" /> Add New Learner</h3>
            <p className="text-sm text-gray-500 mb-4">Create an account for a learner and assign them to your dashboard.</p>
            <form onSubmit={handleAddLearner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required type="text" className="input-field" value={newLearner.name} onChange={e => setNewLearner({ ...newLearner, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" className="input-field" value={newLearner.email} onChange={e => setNewLearner({ ...newLearner, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Password</label>
                <input required type="password" minLength={6} className="input-field" value={newLearner.password} onChange={e => setNewLearner({ ...newLearner, password: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={api.loading} className="btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}