import { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import Loading from '../../components/ui/Loading';
import Card from '../../components/ui/Card';
import { Flag, Star, Check, X, Eye, MessageSquare, AlertTriangle } from 'lucide-react';
import usePageTitle from '../../hooks/usePageTitle';

export default function ContentModeration() {
  usePageTitle('Content Moderation');
  const api = useApi();
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('flagged');

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
      fetchFlagged();
    } catch (err) {
      alert(err.response?.data?.message || 'Error moderating review');
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
          <Flag className="text-orange-500" /> Content Moderation
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review flagged course reviews</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-orange-500">{reviews.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Flagged Reviews</p>
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
            <p className="text-gray-500 dark:text-gray-400">No flagged content! Everything looks clean.</p>
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
