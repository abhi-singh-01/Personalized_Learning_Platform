import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import {
  Radio, Users, Monitor, StopCircle, Eye, Clock, Video,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';
import { formatElapsedDuration } from '../../utils/helpers';

export default function LiveClassMonitor() {
  usePageTitle('Live Monitor');
  const api = useApi();
  const [classes, setClasses] = useState([]);
  const [statusFilter, setStatusFilter] = useState('live');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [message, setMessage] = useState('');
  const [confirmEndId, setConfirmEndId] = useState(null);

  const fetchClasses = async () => {
    try {
      const res = await api.get(`/live-classes/admin/all?status=${statusFilter}`);
      setClasses(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchClasses(); }, [statusFilter]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchClasses, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, statusFilter]);

  const handleForceEnd = async (classId) => {
    if (confirmEndId !== classId) {
      setConfirmEndId(classId);
      setMessage('Click Force End again to confirm disconnecting learners.');
      return;
    }
    try {
      await api.put(`/live-classes/admin/${classId}/force-end`);
      setConfirmEndId(null);
      setMessage('Live class ended.');
      fetchClasses();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error ending class');
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

  if (api.loading && classes.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="text-red-500" /> Live Class Monitor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage all live classes in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} className="rounded" />
            Auto-refresh
          </label>
          <button onClick={fetchClasses} className="btn-secondary flex items-center gap-1 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>
      {message && (
        <div className="rounded-xl px-4 py-3 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {message}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {['live', 'waiting', 'ended'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors capitalize ${statusFilter === s ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {s === 'live' && <span className="inline-flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live</span>}
            {s !== 'live' && s}
          </button>
        ))}
      </div>

      {/* Summary */}
      {statusFilter === 'live' && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <p className="text-2xl font-bold text-red-500">{classes.length}</p>
            <p className="text-xs text-gray-500">Active Classes</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-blue-600">{classes.reduce((sum, c) => sum + (c.currentAttendees || 0), 0)}</p>
            <p className="text-xs text-gray-500">Total Learners Online</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-purple-600">{new Set(classes.map(c => c.educator?._id)).size}</p>
            <p className="text-xs text-gray-500">Educators Teaching</p>
          </Card>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-3">
        {classes.length === 0 && (
          <Card className="text-center py-8">
            <Video size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No {statusFilter} classes right now</p>
          </Card>
        )}
        {classes.map(cls => (
          <Card key={cls._id} className="!p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {cls.status === 'live' && <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />}
                  <span className="font-semibold">{cls.roomName || cls.topic || 'Untitled Class'}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Course: <span className="font-medium text-gray-700 dark:text-gray-300">{cls.course?.title}</span>
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Users size={12} /> {cls.currentAttendees || 0} learners</span>
                  <span className="flex items-center gap-1"><Monitor size={12} /> Peak: {cls.peakAttendance || 0}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {cls.status === 'ended' ? 'Duration: ' : 'Elapsed: '}
                    {formatClassDuration(cls)}
                  </span>
                  <span>👤 {cls.educator?.name}</span>
                </div>
              </div>
              {cls.status === 'live' && (
                <button onClick={() => handleForceEnd(cls._id)}
                  className="flex items-center gap-1 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                  <StopCircle size={14} /> {confirmEndId === cls._id ? 'Confirm End' : 'Force End'}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
