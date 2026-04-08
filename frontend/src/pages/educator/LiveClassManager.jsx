import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import {
  Radio, Play, StopCircle, Plus, Clock, Users, Video,
  Calendar, Eye, History, AlertCircle
} from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function LiveClassManager() {
  usePageTitle('Live Classes');
  const api = useApi();
  const [activeClasses, setActiveClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('active');
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [quickForm, setQuickForm] = useState({ courseId: '', topic: '', maxParticipants: 100 });
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [activeRes, coursesRes, schedulesRes] = await Promise.all([
        api.get('/live-classes/educator/active'),
        api.get('/courses/teaching'),
        api.get('/schedules/educator'),
      ]);
      setActiveClasses(activeRes.data || []);
      setCourses(coursesRes.data || []);
      setSchedules((schedulesRes.data || []).filter(s => s.status === 'scheduled'));
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/live-classes/educator/history');
      setHistory(res.data?.classes || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab]);

  const handleStartFromSchedule = async (scheduleId) => {
    setError('');
    try {
      await api.post(`/live-classes/start/${scheduleId}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting class');
    }
  };

  const handleQuickStart = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/live-classes/start-quick', quickForm);
      setShowQuickStart(false);
      setQuickForm({ courseId: '', topic: '', maxParticipants: 100 });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting class');
    }
  };

  const handleEndClass = async (classId) => {
    if (!window.confirm('End this live class?')) return;
    try {
      await api.put(`/live-classes/${classId}/end`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error ending class');
    }
  };

  const formatDuration = (start) => {
    if (!start) return '—';
    const mins = Math.floor((Date.now() - new Date(start)) / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
              <Radio size={24} className="text-red-500" />
            </div>
            Live Classes
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your live classes</p>
        </div>
        <button onClick={() => setShowQuickStart(true)}
          className="btn-primary flex items-center gap-1 text-sm">
          <Plus size={16} /> Quick Start Class
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'active', label: 'Active', icon: Radio },
          { key: 'scheduled', label: 'Scheduled', icon: Calendar },
          { key: 'history', label: 'History', icon: History },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === t.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon size={14} /> {t.label}
            {t.key === 'active' && activeClasses.length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">{activeClasses.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Active Tab */}
      {tab === 'active' && (
        <div className="space-y-3">
          {activeClasses.length === 0 && (
            <Card className="text-center py-8">
              <Video size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No live classes right now</p>
              <p className="text-xs text-gray-400 mt-1">Start one from your schedule or use Quick Start</p>
            </Card>
          )}
          {activeClasses.map(cls => (
            <Card key={cls._id} className="!p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <span className="font-semibold">{cls.roomName || cls.topic || 'Live Class'}</span>
                  </div>
                  <p className="text-sm text-gray-500">{cls.course?.title}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users size={12} /> {cls.currentAttendees || 0} learners</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(cls.startedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/educator/live-room/${cls._id}`}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                    <Eye size={14} /> View
                  </Link>
                  <button onClick={() => handleEndClass(cls._id)}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <StopCircle size={14} /> End
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Scheduled Tab */}
      {tab === 'scheduled' && (
        <div className="space-y-3">
          {schedules.length === 0 && (
            <Card className="text-center py-8">
              <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No scheduled classes</p>
            </Card>
          )}
          {schedules.map(sched => (
            <Card key={sched._id} className="!p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold">{sched.title}</p>
                  <p className="text-sm text-gray-500">{sched.course?.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    📅 {new Date(sched.scheduledAt).toLocaleString()} · {sched.duration}min
                  </p>
                </div>
                <button onClick={() => handleStartFromSchedule(sched._id)}
                  className="flex items-center gap-1 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm">
                  <Play size={14} /> Go Live
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {history.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-gray-500">No past classes yet</p>
            </Card>
          )}
          {history.map(cls => (
            <Card key={cls._id} className="!p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{cls.roomName || cls.topic || 'Class'}</p>
                  <p className="text-sm text-gray-500">{cls.course?.title}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>📅 {new Date(cls.startedAt).toLocaleDateString()}</span>
                    <span>👥 {cls.totalUniqueAttendees || 0} learners</span>
                    <span>📈 Peak: {cls.peakAttendance || 0}</span>
                  </div>
                </div>
                <Link to={`/educator/live-class/${cls._id}/attendance`}
                  className="text-sm text-primary-600 hover:underline">
                  View Details →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Start Modal */}
      {showQuickStart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Quick Start Live Class</h3>
            <form onSubmit={handleQuickStart} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select required className="input-field" value={quickForm.courseId}
                  onChange={e => setQuickForm({ ...quickForm, courseId: e.target.value })}>
                  <option value="">Select course...</option>
                  {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Topic (optional)</label>
                <input className="input-field" placeholder="e.g., Doubt clearing session"
                  value={quickForm.topic} onChange={e => setQuickForm({ ...quickForm, topic: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants</label>
                <input type="number" className="input-field" min={1} max={500}
                  value={quickForm.maxParticipants} onChange={e => setQuickForm({ ...quickForm, maxParticipants: parseInt(e.target.value) || 100 })} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowQuickStart(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={api.loading} className="btn-primary flex items-center gap-1">
                  <Play size={14} /> Go Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
