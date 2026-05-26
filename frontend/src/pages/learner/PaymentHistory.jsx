import { useState, useEffect, Fragment } from 'react';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import {
  CreditCard, IndianRupee, Calendar, Clock, RotateCcw, CheckCircle2,
  XCircle, AlertCircle, BookOpen, Receipt, Copy, MessageSquare,
} from 'lucide-react';

function formatINR(amount) {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });
}

const statusConfig = {
  captured: { label: 'Paid', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400', icon: CheckCircle2 },
  created: { label: 'Pending', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400', icon: Clock },
  failed: { label: 'Failed', color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
  refunded: { label: 'Refunded', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400', icon: RotateCcw },
};

export default function PaymentHistory() {
  const api = useApi();
  usePageTitle('Payment History');
  const [payments, setPayments] = useState([]);
  const [refunding, setRefunding] = useState(null);
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState({ total: 0, count: 0 });
  const [queryModal, setQueryModal] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [queryText, setQueryText] = useState('');
  const [querySubmitting, setQuerySubmitting] = useState(false);

  const copyField = async (label, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setMessage(`${label} copied to clipboard.`);
      setTimeout(() => setMessage(''), 2500);
    } catch {
      setMessage('Could not copy — select and copy manually.');
    }
  };

  const formatCountdown = (iso) => {
    if (!iso) return '';
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'May be removed on next cleanup run';
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  const submitRaiseQuery = async () => {
    if (!queryModal) return;
    setQuerySubmitting(true);
    try {
      await api.post('/payments/raise-query', {
        paymentId: queryModal._id,
        message: queryText.trim() || 'I need help with this failed payment.',
      });
      setMessage('Support query recorded. This failed payment will stay in your history.');
      setQueryModal(null);
      setQueryText('');
      loadPayments();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Could not submit query.');
    }
    setQuerySubmitting(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await api.get('/payments/history');
      const data = res.data || [];
      setPayments(data);
      const captured = data.filter((p) => p.status === 'captured');
      setSummary({
        total: captured.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
        count: captured.length,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const requestRefund = async (paymentId) => {
    setRefunding(paymentId);
    setMessage('');
    try {
      await api.post('/payments/refund', { paymentId, reason: 'Requested by learner' });
      setRefundModal(null);
      setMessage('Refund initiated successfully. It may take 5-7 business days to process.');
      loadPayments();
    } catch (e) {
      setMessage(e.response?.data?.message || 'Refund request failed.');
    }
    setRefunding(null);
  };

  const canRefund = (payment) => {
    if (payment.status !== 'captured') return false;
    const paidAt = new Date(payment.paidAt || payment.createdAt);
    const daysSince = (Date.now() - paidAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  };

  if (api.loading && payments.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 text-white shadow-lg shadow-primary-500/20">
          <Receipt size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Payment History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track all your course payments and refunds</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-100/50 to-transparent dark:from-emerald-900/20 rounded-bl-full" />
          <div className="relative">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
              <IndianRupee size={20} />
              {formatINR(summary.total)}
            </p>
          </div>
        </Card>
        <Card className="!p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100/50 to-transparent dark:from-blue-900/20 rounded-bl-full" />
          <div className="relative">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Courses Purchased</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.count}</p>
          </div>
        </Card>
        <Card className="!p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/50 to-transparent dark:from-amber-900/20 rounded-bl-full" />
          <div className="relative">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
          </div>
        </Card>
      </div>

      {message && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
          <AlertCircle size={16} />
          {message}
        </div>
      )}

      {/* Payments Table */}
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" description="Your payment history will appear here once you enroll in a paid course." icon={CreditCard} />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Course</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600 dark:text-gray-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.map((p) => {
                  const config = statusConfig[p.status] || statusConfig.created;
                  const StatusIcon = config.icon;
                  const snap = p.supportSnapshot || {};
                  return (
                    <Fragment key={p._id}>
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                            <BookOpen size={16} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                              {p.course?.title || 'Untitled Course'}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              by {p.educator?.name || 'Educator'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                          <Calendar size={14} className="text-gray-400" />
                          <span>{formatDate(p.paidAt || p.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatTime(p.paidAt || p.createdAt)}</p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-gray-900 dark:text-white flex items-center justify-end gap-0.5">
                          <IndianRupee size={14} />
                          {formatINR(p.totalAmount || p.amount)}
                        </span>
                        {p.platformFee > 0 && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            incl. ₹{formatINR(p.platformFee)} fee + ₹{formatINR(p.gst)} GST
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon size={13} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {canRefund(p) ? (
                          <button
                            onClick={() => setRefundModal(p)}
                            disabled={refunding === p._id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <RotateCcw size={13} />
                            {refunding === p._id ? 'Processing...' : 'Refund'}
                          </button>
                        ) : p.status === 'failed' && !p.paymentQueryRaisedAt ? (
                          <button
                            type="button"
                            onClick={() => { setQueryModal(p); setQueryText(''); }}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <MessageSquare size={13} />
                            Raise query
                          </button>
                        ) : p.status === 'failed' && p.paymentQueryRaisedAt ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Query logged</span>
                        ) : p.status === 'refunded' ? (
                          <span className="text-xs text-gray-400">Refunded</span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                    {p.status === 'failed' && (
                      <tr className="bg-red-50/40 dark:bg-red-950/20">
                        <td colSpan={5} className="px-5 py-4 text-xs text-gray-700 dark:text-gray-300">
                          <p className="font-semibold text-red-700 dark:text-red-300 mb-2 flex flex-wrap items-center gap-2">
                            Details for Razorpay / bank support
                            {p.paymentQueryRaisedAt ? (
                              <Badge variant="primary">Kept — query raised</Badge>
                            ) : p.autoDeleteAt ? (
                              <span className="font-normal text-gray-600 dark:text-gray-400">
                                Auto-removed in ~{formatCountdown(p.autoDeleteAt)} if no query
                              </span>
                            ) : null}
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2 mb-2">
                            {[
                              ['Order ID', snap.razorpayOrderId || p.razorpayOrderId],
                              ['Payment ID', snap.razorpayPaymentId || p.razorpayPaymentId || '—'],
                              ['Amount', `${snap.currency || p.currency || 'INR'} ${formatINR(snap.totalAmount ?? p.totalAmount)}`],
                              ['Course', snap.courseTitle || p.course?.title],
                              ['Educator', snap.educatorName || p.educator?.name],
                              ['Your email (at failure)', snap.learnerEmail || '—'],
                            ].map(([label, val]) => (
                              <div key={label} className="flex items-start justify-between gap-2 bg-white/60 dark:bg-gray-900/40 rounded-lg px-2 py-1.5 border border-red-100/80 dark:border-red-900/40">
                                <div className="min-w-0">
                                  <span className="text-[10px] uppercase tracking-wide text-gray-500">{label}</span>
                                  <p className="font-mono text-[11px] break-all">{val || '—'}</p>
                                </div>
                                {val && val !== '—' && (
                                  <button
                                    type="button"
                                    onClick={() => copyField(label, val)}
                                    className="p-1 rounded text-gray-500 hover:text-primary-600"
                                    title="Copy"
                                  >
                                    <Copy size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {p.failureDetails && (p.failureDetails.description || p.failureDetails.code) && (
                            <p className="text-[11px] text-red-600/90 dark:text-red-400/90">
                              Gateway: {p.failureDetails.code && `${p.failureDetails.code} — `}
                              {p.failureDetails.description}
                              {p.failureDetails.reason && ` (${p.failureDetails.reason})`}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Refund Policy Note */}
      <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">Refund Policy</p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/70 leading-relaxed">
          Refunds can be requested within 7 days of purchase. After a refund, you will be un-enrolled from the course. 
          Refunds are processed to your original payment method and may take 5-7 business days.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">Failed payments</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          Failed attempts show order and payment IDs you can share with support or Razorpay.
          If you do not use <strong className="font-medium">Raise query</strong>, the row is removed automatically after{' '}
          {payments[0]?.retentionHours || 72} hours (no dispute logged). Raising a query keeps the record.
        </p>
      </div>

      <Modal
        open={!!queryModal}
        onClose={() => !querySubmitting && setQueryModal(null)}
        title="Raise payment query"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Tell us briefly what went wrong. This flags the failed payment so it is not auto-deleted.
        </p>
        <textarea
          className="input-field min-h-[100px] text-sm mb-4"
          placeholder="e.g. Card was charged but course did not unlock…"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" disabled={querySubmitting} onClick={() => setQueryModal(null)}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={querySubmitting} onClick={submitRaiseQuery}>
            {querySubmitting ? 'Submitting…' : 'Submit query'}
          </button>
        </div>
      </Modal>
      <Modal
        open={!!refundModal}
        onClose={() => !refunding && setRefundModal(null)}
        title="Request refund"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to request a refund for {refundModal?.course?.title || 'this course'}? You will be un-enrolled after approval.
        </p>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary" disabled={!!refunding} onClick={() => setRefundModal(null)}>
            Cancel
          </button>
          <button type="button" className="bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-5 rounded-xl" disabled={!!refunding} onClick={() => requestRefund(refundModal._id)}>
            {refunding ? 'Processing...' : 'Request refund'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
