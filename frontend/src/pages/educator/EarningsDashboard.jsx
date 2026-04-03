import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { DollarSign, TrendingUp, Clock, Calendar, IndianRupee, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function EarningsDashboard() {
  const api = useApi();
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/payments/earnings');
        setEarnings(res.data);
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  if (api.loading && !earnings) return <Loading />;
  if (!earnings) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <div className="p-2 rounded-xl bg-green-100 dark:bg-green-900/30">
            <IndianRupee size={24} className="text-green-600" />
          </div>
          Earnings Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Track your revenue and payout history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <IndianRupee size={18} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold">₹{(earnings.totalEarnings || 0).toLocaleString()}</p>
        </Card>

        <Card className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp size={18} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Pending Payouts</span>
          </div>
          <p className="text-2xl font-bold">₹{(earnings.pendingPayouts || 0).toLocaleString()}</p>
        </Card>

        <Card className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign size={18} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Processed Payouts</span>
          </div>
          <p className="text-2xl font-bold">₹{(earnings.processedPayouts || 0).toLocaleString()}</p>
        </Card>

        <Card className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Calendar size={18} className="text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Total Sales</span>
          </div>
          <p className="text-2xl font-bold">{earnings.totalSales || 0}</p>
        </Card>
      </div>

      {/* Recent Transactions */}
      {earnings.recentPayments && earnings.recentPayments.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">
            Recent Transactions
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Learner</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.recentPayments.map(p => (
                  <tr key={p._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.paidAt || p.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{p.course?.title || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{p.user?.name || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">₹{p.coursePrice}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'captured' ? 'bg-green-100 text-green-700' : p.status === 'refunded' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payout History */}
      {earnings.payouts && earnings.payouts.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold">
            Payout History
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3">Scheduled</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Processed</th>
                </tr>
              </thead>
              <tbody>
                {earnings.payouts.map(p => (
                  <tr key={p._id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(p.scheduledAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-semibold">₹{p.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.status === 'processed' ? 'bg-green-100 text-green-700' :
                        p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
