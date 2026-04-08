import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { FileText, Filter, Search, User, Calendar, ChevronDown } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

const ACTION_ICONS = {
  user_created: '👤', user_deleted: '🗑️', user_role_changed: '🔄',
  course_created: '📚', course_deleted: '🗑️', course_updated: '✏️',
  coupon_created: '🎟️', coupon_deactivated: '❌',
  setting_changed: '⚙️', payout_approved: '💰', payout_rejected: '❌',
  announcement_sent: '📢', flag_toggled: '🚩', ui_config_created: '🎨',
};

export default function AuditLogs() {
  usePageTitle('Audit Logs');
  const api = useApi();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', startDate: '', endDate: '' });
  const [uniqueActions, setUniqueActions] = useState([]);
  const [showStats, setShowStats] = useState(false);

  const fetchLogs = async (pg = 1) => {
    try {
      const params = new URLSearchParams({ page: pg, limit: 30 });
      if (filters.action) params.set('action', filters.action);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setUniqueActions(res.data.uniqueActions || []);
      setPage(pg);
    } catch (e) { console.error(e); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/audit-logs/stats');
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchLogs(1); }, [filters]);

  const totalPages = Math.ceil(total / 30);

  if (api.loading && logs.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary-600" /> Audit Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track all administrative actions</p>
        </div>
        <button onClick={() => { setShowStats(!showStats); if (!stats) fetchStats(); }}
          className="btn-secondary text-sm">
          📊 {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>

      {/* Stats */}
      {showStats && stats && (
        <Card>
          <h3 className="font-semibold mb-3">Last 30 Days Activity</h3>
          <div className="space-y-2">
            {stats.actionCounts?.slice(0, 8).map(ac => (
              <div key={ac._id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{ACTION_ICONS[ac._id] || '📋'} {ac._id}</span>
                <span className="font-semibold">{ac.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input-field w-auto" value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" className="input-field w-auto" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} placeholder="Start date" />
        <input type="date" className="input-field w-auto" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} placeholder="End date" />
      </div>

      {/* Logs */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No audit logs found</td></tr>
              )}
              {logs.map(log => (
                <tr key={log._id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium">{log.admin?.name || '—'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 font-mono">
                      {ACTION_ICONS[log.action] || '📋'} {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {log.targetModel && <span>{log.targetModel}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">Page {page} of {totalPages} ({total} logs)</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => fetchLogs(page - 1)}
                className="btn-secondary text-sm disabled:opacity-50">Prev</button>
              <button disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}
                className="btn-secondary text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
