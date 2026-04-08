import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';
import { StatCard } from '../../components/ui/Card';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Loading from '../../components/ui/Loading';
import ReportExporter from '../../components/ui/ReportExporter';
import { levelColors, riskColors, formatDate } from '../../utils/helpers';
import {
  Users, BookOpen, FileText, Trophy, PlusCircle, Upload, Brain, AlertTriangle,
  Video, X, ChevronRight, Calendar, Clock, XCircle, CalendarPlus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import usePageTitle from '../../hooks/usePageTitle';

const PIE_COLORS = ['#f97316', '#eab308', '#3b82f6', '#22c55e'];

/* ── Course Selector Modal ── */
function CourseSelectModal({ open, onClose, courses, loading, targetPath, title, icon: Icon }) {
  const nav = useNavigate();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={20} className="text-primary-600" />}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title || 'Select a Course'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No courses yet</p>
                <Link to="/educator/courses/new" onClick={onClose} className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors">
                <PlusCircle size={16} /> Create Course
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {courses.map((c) => (
                <button
                  key={c._id}
                  onClick={() => { onClose(); nav(`/educator/courses/${c._id}/${targetPath}`); }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 text-left group"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{c.title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{c.learners?.length || 0} learners · {c.category || 'Uncategorized'}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Schedule Form Modal ── */
function ScheduleModal({ open, onClose, courses, onSubmit }) {
  const [form, setForm] = useState({ course: '', title: '', description: '', scheduledAt: '', duration: 60, meetingLink: '' });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
    setForm({ course: '', title: '', description: '', scheduledAt: '', duration: 60, meetingLink: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-3">
            <CalendarPlus size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Schedule Live Lecture</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Course *</label>
            <select className="input-field" required value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
              <option value="">Select a course</option>
              {courses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Lecture Title *</label>
            <input className="input-field" required placeholder="e.g. Introduction to React Hooks" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Description</label>
            <textarea className="input-field" rows={2} placeholder="What will be covered..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Date & Time *</label>
              <input type="datetime-local" className="input-field" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Duration (min)</label>
              <input type="number" className="input-field" min={15} max={300} value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Meeting Link (optional)</label>
            <input className="input-field" placeholder="https://meet.google.com/..." value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CalendarPlus size={18} />}
            {saving ? 'Scheduling...' : 'Schedule Lecture'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EducatorDashboard() {
  usePageTitle('Educator Dashboard');
  const { user } = useAuth();
  const api = useApi();
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, targetPath: '', title: '', icon: null });
  const [scheduleModal, setScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return; // StrictMode guard
    fetchedRef.current = true;

    api.get('/analytics/educator/dashboard').then((res) => setData(res.data)).catch(() => {});
    api.get('/schedules/educator').then((res) => setSchedules(res.data || [])).catch(() => {});
  }, []);

  const fetchCourses = () => {
    if (courses.length === 0) {
      setCoursesLoading(true);
      api.get('/courses/teaching')
        .then((res) => setCourses(res.data || []))
        .finally(() => setCoursesLoading(false));
    }
  };

  const openCourseModal = (targetPath, title, icon) => {
    setModal({ open: true, targetPath, title, icon });
    fetchCourses();
  };

  const openScheduleModal = () => {
    fetchCourses();
    setScheduleModal(true);
  };

  const handleScheduleSubmit = async (form) => {
    try {
      const res = await api.post('/schedules', form);
      setSchedules([...schedules, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await api.put('/schedules/' + cancelId + '/cancel', { reason: cancelReason || 'Class cancelled by educator' });
      setSchedules(schedules.map((s) => s._id === cancelId ? { ...s, status: 'cancelled', cancelReason: cancelReason || 'Class cancelled by educator' } : s));
      setCancelId(null);
      setCancelReason('');
    } catch (err) {
      console.error(err);
    }
  };

  if (api.loading && !data) return <Loading />;
  if (!data) return <Loading />;

  const pieData = Object.entries(data.levelDistribution || {}).map(([name, value]) => ({ name, value }));

  const upcomingSchedules = schedules.filter((s) => s.status === 'scheduled' && new Date(s.scheduledAt) >= new Date());
  const cancelledSchedules = schedules.filter((s) => s.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Educator Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={openScheduleModal} className="btn-primary text-sm flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700">
            <CalendarPlus size={16} /> Schedule Lecture
          </button>
          <Link to="/educator/courses/new" className="btn-primary text-sm flex items-center gap-1">
            <PlusCircle size={16} /> New Course
          </Link>
        </div>
      </div>

      {/* Upcoming Scheduled Lectures */}
      {upcomingSchedules.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar size={20} className="text-emerald-500" /> Upcoming Lectures
          </h2>
          <div className="space-y-3">
            {upcomingSchedules.map((s) => (
              <div key={s._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <Video size={20} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{s.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {s.course?.title || 'Course'} · {s.duration} min
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(s.scheduledAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(s.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.meetingLink && (
                    <a href={s.meetingLink} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                      Join Link
                    </a>
                  )}
                  <button
                    onClick={() => setCancelId(s._id)}
                    className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recently Cancelled */}
      {cancelledSchedules.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <XCircle size={20} className="text-red-400" /> Cancelled Lectures
          </h2>
          <div className="space-y-2">
            {cancelledSchedules.slice(0, 5).map((s) => (
              <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                <div>
                  <p className="font-medium text-sm text-gray-600 dark:text-gray-300 line-through">{s.title}</p>
                  <p className="text-xs text-red-500 mt-0.5">Reason: {s.cancelReason}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(s.scheduledAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ReportExporter title="Analytics & Reports" filename={`Class_Report_${new Date().toISOString().split('T')[0]}.pdf`}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Learners" value={data.totalLearners} color="blue" />
            <StatCard icon={BookOpen} label="Total Courses" value={data.totalCourses} color="primary" />
            <StatCard icon={FileText} label="Total Materials" value={data.totalMaterials} color="green" />
            <StatCard icon={Trophy} label="Avg Class Score" value={data.avgClassScore + '%'} color="yellow" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {data.coursePerformance?.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Course Performance</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.coursePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {pieData.some((d) => d.value > 0) && (
              <Card>
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">AI Level Distribution</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => name + ': ' + value}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {data.atRisk?.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <AlertTriangle size={20} className="text-red-500" /> Learners at Risk
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Engagement</th>
                      <th className="pb-3 font-medium">Avg Score</th>
                      <th className="pb-3 font-medium">Last Active</th>
                      <th className="pb-3 font-medium">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.atRisk.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{s.engagementScore}</td>
                        <td className="py-3 text-gray-700 dark:text-gray-300">{s.averageScore}%</td>
                        <td className="py-3 text-gray-500 dark:text-gray-400">{s.lastActive ? formatDate(s.lastActive) : 'Never'}</td>
                        <td className="py-3">
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (riskColors[s.risk] || riskColors.Medium)}>
                            {s.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {data.topPerformers?.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Trophy size={20} className="text-yellow-500" /> Top Performers
              </h2>
              <div className="space-y-3">
                {data.topPerformers.map((s, i) => (
                  <div key={s._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-300 dark:text-gray-600 w-6">#{i + 1}</span>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{s.name}</p>
                        <span className={'px-2 py-0.5 rounded-full text-xs ' + (levelColors[s.aiLevel] || '')}>{s.aiLevel}</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-primary-600">{s.averageScore}%</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </ReportExporter>

      <Card>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/educator/courses/new" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
            <PlusCircle size={20} className="text-primary-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">New Course</span>
          </Link>
          <Link to="/educator/learners" className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
            <Users size={20} className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">View Learners</span>
          </Link>
          <button onClick={() => openCourseModal('materials', 'Upload Material', Upload)} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left">
            <Upload size={20} className="text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Upload Material</span>
          </button>
          <button onClick={() => openCourseModal('quizzes', 'Generate AI Quiz', Brain)} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left">
            <Brain size={20} className="text-violet-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Generate AI Quiz</span>
          </button>
          <button onClick={() => openCourseModal('live', 'Start Live Lecture', Video)} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left">
            <Video size={20} className="text-red-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Start Live Lecture</span>
          </button>
          <button onClick={openScheduleModal} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left">
            <CalendarPlus size={20} className="text-emerald-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Schedule Lecture</span>
          </button>
        </div>
      </Card>

      {/* Modals */}
      <CourseSelectModal open={modal.open} onClose={() => setModal({ ...modal, open: false })} courses={courses} loading={coursesLoading} targetPath={modal.targetPath} title={modal.title} icon={modal.icon} />
      <ScheduleModal open={scheduleModal} onClose={() => setScheduleModal(false)} courses={courses} onSubmit={handleScheduleSubmit} />

      {/* Cancel Confirmation Dialog */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setCancelId(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-600">
              <XCircle size={20} /> Cancel Lecture
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Learners will be notified about this cancellation.</p>
            <textarea
              className="input-field mb-4"
              rows={3}
              placeholder="Reason for cancellation (e.g. emergency, rescheduled)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setCancelId(null)} className="btn-secondary flex-1">Keep</button>
              <button onClick={handleCancel} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-lg transition-all">Cancel Class</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
