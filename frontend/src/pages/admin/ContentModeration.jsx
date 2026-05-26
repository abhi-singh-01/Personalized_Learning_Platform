import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { Flag, Star, Check, X, Eye, MessageSquare, AlertTriangle } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function ContentModeration() {
  usePageTitle('Review Moderation');
  const api = useApi();
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('flagged');
  const [message, setMessage] = useState('');

  const fetchFlagged = async () => {
    try {
      const res = await api.get('/reviews/flagged');
      setReviews(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchFlagged(); }, []);

  const handleModerate = async (reviewId, action) => {
    try {
      await api.put(`/reviews/${reviewId}/moderate`, { action });
      setMessage(`Review ${action === 'approve' ? 'approved' : 'rejected'}.`);
      fetchFlagged();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error moderating review');
    }
  };

  const renderStars = (rating) => Array.from({ length: 5 }, (_, i) => (
    <Star key={i} size={14} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
  ));

  if (api.loading && reviews.length === 0) return <Loading />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Flag className="text-orange-500" /> Review Moderation
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
          When a learner reports a course review as inappropriate, it appears here for your decision.
          Approve to keep it visible, or reject to hide it from the course page.
        </p>
      </div>

      <Card className="!p-4 bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40">
        <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-300">
          <AlertTriangle size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200">What does &quot;flagged&quot; mean?</p>
            <p className="mt-1 leading-relaxed">
              A <strong>flag</strong> is a report from a learner — not an error. It means someone marked a review
              as spam, offensive, or misleading. You review it and choose Approve or Reject. If there are no reports,
              this page stays empty (which is normal).
            </p>
          </div>
        </div>
      </Card>
      {message && (
        <div className="rounded-xl px-4 py-3 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {message}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-orange-500">{reviews.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Reported by learners</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-red-500">{reviews.filter(r => !r.isApproved).length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Rejected</p>
        </Card>
      </div>

      {/* Flagged Reviews */}
      <div className="space-y-3">
        {reviews.length === 0 && (
          <Card className="text-center py-8">
            <Check size={40} className="mx-auto text-green-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No reported reviews right now — nothing for you to review.</p>
          </Card>
        )}
        {reviews.map(review => (
          <Card key={review._id} className="!p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{review.title || 'No title'}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.comment}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                    <span>By: {review.learner?.name || 'Unknown'}</span>
                    <span>Course: {review.course?.title || 'Unknown'}</span>
                    <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  {review.reportReason && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                      <AlertTriangle size={12} /> Report: {review.reportReason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleModerate(review._id, 'approve')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/20 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => handleModerate(review._id, 'reject')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
