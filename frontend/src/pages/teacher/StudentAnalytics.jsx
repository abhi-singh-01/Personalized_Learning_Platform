import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import { levelColors, formatDate } from '../../utils/helpers';
import { Users, Search } from 'lucide-react';

import { UserPlus } from 'lucide-react';

export default function StudentAnalytics() {
  const api = useApi();
  const [courses, setCourses] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });

  const fetchData = async () => {
    try {
      const res = await api.get('/courses/teaching');
      setCourses(res.data || []);
      // Fetch teacher's specific assigned students and merge them in
      const meRes = await api.get('/auth/me');
      setAssignedStudents(meRes.data?.assignedStudents || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/student', newStudent);
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', password: '' });
      fetchData(); // Refresh list
    } catch (err) {
      alert(err.message || 'Error adding student');
    }
  };

  if (api.loading && courses.length === 0) return <Loading />;

  const allStudents = [];
  const seen = new Set();
  courses.forEach((c) => {
    (c.students || []).forEach((s) => {
      if (!seen.has(s._id)) {
        seen.add(s._id);
        allStudents.push(s);
      }
    });
  });

  // Also display students directly assigned to the teacher
  assignedStudents.forEach(s => {
    if (s && !seen.has(s._id)) {
      seen.add(s._id);
      allStudents.push(s);
    }
  });

  const filtered = allStudents.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold">Student Analytics</h1>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-10 w-64" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <UserPlus size={18} /> Add Student
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No students found" icon={Users} description="Add students or wait for them to enroll in your courses." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Student</th>
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><UserPlus size={20} className="text-primary-600" /> Add New Student</h3>
            <p className="text-sm text-gray-500 mb-4">Create an account for a student and assign them to your dashboard.</p>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input required type="text" className="input-field" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" className="input-field" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Initial Password</label>
                <input required type="password" minLength={6} className="input-field" value={newStudent.password} onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} />
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