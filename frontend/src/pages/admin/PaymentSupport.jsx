import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import useApi from '../../hooks/useApi';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import Modal from '../../components/ui/Modal';
import usePageTitle from '../../hooks/usePageTitle';

export default function PaymentSupport() {
  usePageTitle('Payment Support');
  const api = useApi();
  const [queries, setQueries] = useState([]);
  const [status, setStatus] = useState('open');
  const [message, setMessage] = useState('');
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolution, setResolution] = useState('');

  const loadQueries = async () => {
    const res = await api.get(`/payments/admin/queries?status=${status}`);
    setQueries(res.data || []);
  };

  useEffect(() => {
    loadQueries();
  }, [status]);

  const resolveQuery = async () => {
    if (!resolution.trim()) return;
    await api.patch(`/payments/admin/queries/${resolveTarget._id}/resolve`, { resolution });
    setMessage('Payment query marked as resolved.');
    setResolveTarget(null);
    setResolution('');
    await loadQueries();
  };

  if (api.loading && queries.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="text-primary-600" />
          Payment Support
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review failed payments that learners flagged for help.</p>
      </div>

      {message && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="flex gap-2">
        {['open', 'resolved', 'all'].map((key) => (
          <button
            key={key}
            onClick={() => setStatus(key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize ${
              status === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Issue</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {queries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">No payment queries found.</td>
                </tr>
              ) : queries.map((query) => (
                <tr key={query._id} className="border-b border-gray-100 dark:border-gray-800 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{query.user?.name || 'Learner'}</div>
                    <div className="text-xs text-gray-500">{query.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">{query.course?.title || 'Course'}</td>
                  <td className="px-4 py-3 text-xs">{query.razorpayOrderId}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <div>{query.paymentQueryMessage || query.failureDetails?.description || 'Payment failed'}</div>
                    {query.paymentQueryResolution && (
                      <div className="text-xs text-emerald-600 mt-1">Resolution: {query.paymentQueryResolution}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{query.paymentQueryStatus || 'open'}</td>
                  <td className="px-4 py-3">
                    {query.paymentQueryStatus !== 'resolved' && (
                      <button
                        onClick={() => { setResolveTarget(query); setResolution(''); }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        <CheckCircle size={14} />
                        Resolve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal
        open={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        title="Resolve payment query"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Add a short resolution note for {resolveTarget?.user?.name || 'this learner'}.
        </p>
        <textarea
          className="input-field min-h-[110px] mb-4"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="Example: Verified with Razorpay, no debit found. Asked learner to retry checkout."
        />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setResolveTarget(null)}>Cancel</button>
          <button type="button" className="btn-primary" onClick={resolveQuery} disabled={!resolution.trim()}>Resolve</button>
        </div>
      </Modal>
    </div>
  );
}
