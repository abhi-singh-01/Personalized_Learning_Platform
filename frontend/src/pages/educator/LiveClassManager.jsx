import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useSocket } from '../../context/SocketContext';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import {
  Radio, Play, StopCircle, Plus, Clock, Users, Video, Hand,
  Calendar, Eye, History, AlertCircle
} from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { formatElapsedDuration } from '../../utils/helpers';

export default function LiveClassManager() {
  usePageTitle('Live Classes');
  const navigate = useNavigate();
  const api = useApi();
  const socketCtx = useSocket();
  const [activeClasses, setActiveClasses] = useState([]);
  const [raisedHands, setRaisedHands] = useState({});
  const [courses, setCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('active');
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [quickForm, setQuickForm] = useState({ courseId: '', topic: '', maxParticipants: 100 });
  const [error, setError] = useState('');
  const [endConfirmId, setEndConfirmId] = useState(null);

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

  useEffect(() => {
    if (!socketCtx?.socket || activeClasses.length === 0) return;
    activeClasses.forEach((cls) => {
      if (cls.roomId) socketCtx.emit('room:join', { roomId: cls.roomId });
    });

    const handleRaised = (data) => {
      setRaisedHands((prev) => ({
        ...prev,
        [data.roomId || data.room]: [
          ...(prev[data.roomId || data.room] || []).filter((u) => u.userId !== data.userId),
          data,
        ],
      }));
    };
    const handleLowered = (data) => {
      setRaisedHands((prev) => ({
        ...prev,
        [data.roomId || data.room]: (prev[data.roomId || data.room] || []).filter((u) => u.userId !== data.userId),
      }));
    };

    socketCtx.on('room:hand-raised', handleRaised);
    socketCtx.on('room:hand-lowered', handleLowered);
    return () => {
      socketCtx.off('room:hand-raised', handleRaised);
      socketCtx.off('room:hand-lowered', handleLowered);
      activeClasses.forEach((cls) => {
        if (cls.roomId) socketCtx.emit('room:leave', { roomId: cls.roomId });
      });
    };
  }, [socketCtx?.socket, activeClasses]);

  const goToHostRoom = (liveClass) => {
    const id = liveClass?._id || liveClass;
    if (id) navigate(`/educator/live-class/${id}`);
  };

  const handleStartFromSchedule = async (scheduleId) => {
    setError('');
    try {
      const res = await api.post(`/live-classes/start/${scheduleId}`);
      goToHostRoom(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting class');
    }
  };

  const handleQuickStart = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/live-classes/start-quick', quickForm);
      setShowQuickStart(false);
      setQuickForm({ courseId: '', topic: '', maxParticipants: 100 });
      goToHostRoom(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error starting class');
    }
  };

  const handleEndClass = async (classId) => {
    if (endConfirmId !== classId) {
      setEndConfirmId(classId);
      setError('Click End again to confirm ending this live class.');
      return;
    }
    try {
      await api.put(`/live-classes/${classId}/end`);
      setEndConfirmId(null);
      setError('');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error ending class');
    }
  };

  const formatClassDuration = (cls) => {
    if (!cls.startedAt) return '—';
    const start = new Date(cls.startedAt).getTime();
    const end = cls.status === 'ended' && cls.endedAt
      ? new Date(cls.endedAt).getTime()
      : Date.now();
    return formatElapsedDuration(end - start);
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
            <div key={cls._id} className="rounded-2xl overflow-hidden border border-[#3c4043] bg-gradient-to-br from-[#292a2d] to-[#202124] text-white shadow-lg">
              <div className="px-4 sm:px-5 py-4 border-b border-[#3c4043]/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shrink-0" />
                  <span className="font-semibold truncate">{cls.roomName || cls.topic || 'Live Class'}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono shrink-0">{formatClassDuration(cls)}</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-400">{cls.course?.title}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Users size={12} /> {cls.currentAttendees || 0} in meeting</span>
                  </div>
                  {(raisedHands[cls.roomId] || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(raisedHands[cls.roomId] || []).map((u) => (
                        <span key={u.userId} className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 text-yellow-200 px-2 py-1 text-xs font-medium">
                          <Hand size={12} />
                          {u.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigate(`/educator/live-class/${cls._id}`)}
                    className="flex items-center gap-1 px-4 py-2.5 text-sm rounded-full bg-[#1a73e8] hover:bg-[#1967d2] text-white font-medium transition-colors"
                  >
                    <Eye size={14} /> Join as host
                  </button>
                  <button onClick={() => handleEndClass(cls._id)}
                    className="flex items-center gap-1 px-4 py-2.5 text-sm rounded-full border border-red-500/50 text-red-300 hover:bg-red-500/10 transition-colors">
                    <StopCircle size={14} /> {endConfirmId === cls._id ? 'Confirm' : 'End'}
                  </button>
                </div>
              </div>
            </div>
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
                <span className="text-sm text-gray-400">
                  {formatClassDuration(cls)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Start Modal — portaled to body to avoid transform containment */}
      {showQuickStart && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#292a2d] text-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#3c4043]">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h3 className="text-xl font-semibold">Start a live class</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">Meet-style room with PLP chat & raise hand</p>
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
        </div>,
        document.body
      )}
    </div>
  );
}
