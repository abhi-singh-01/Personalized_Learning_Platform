import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import usePageTitle from '../../hooks/usePageTitle';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Loading from '../../components/ui/Loading';
import { ArrowLeft, Star, Send } from 'lucide-react';

function educatorId(course) {
  const e = course?.educator;
  if (!e) return null;
  return typeof e === 'object' ? e._id : e;
}

export default function CourseReviews() {
  usePageTitle('Course reviews');
  const { courseId } = useParams();
  const { user } = useAuth();
  const api = useApi();
  const toast = useToast();
  const [courseTitle, setCourseTitle] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const loadCourse = async () => {
    try {
      const res = await api.get('/courses/' + courseId);
      const course = res.data;
      setCourseTitle(course?.title || '');
      const owner = educatorId(course);
      const uid = user?.id || user?._id;
      if (owner && uid && String(owner) !== String(uid)) {
        setForbidden(true);
        return false;
      }
      setForbidden(false);
      return true;
    } catch {
      setCourseTitle('');
      setForbidden(true);
      return false;
    }
  };

  const loadReviews = async () => {
    try {
      const res = await api.get('/reviews/course/' + courseId + '?limit=50');
      const list = res.data?.reviews || [];
      setReviews(list);
      setTotal(res.data?.total ?? list.length);
      const drafts = {};
      list.forEach((r) => {
        drafts[r._id] = r.educatorReply || '';
      });
      setReplyDrafts(drafts);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load reviews');
    }
  };

  useEffect(() => {
    if (!courseId || !(user?.id || user?._id)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const ok = await loadCourse();
        if (cancelled) return;
        if (ok) await loadReviews();
        else setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [courseId, user?.id, user?._id]); // eslint-disable-line react-hooks/exhaustive-deps -- loadCourse/loadReviews close over latest api/user

  const saveReply = async (reviewId) => {
    const text = (replyDrafts[reviewId] || '').trim();
    setSavingId(reviewId);
    try {
      await api.post('/reviews/' + reviewId + '/reply', { reply: text });
      toast.success(text ? 'Reply saved' : 'Reply cleared');
      await loadReviews();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save reply');
    } finally {
      setSavingId(null);
    }
  };

  if (loading && !courseTitle && reviews.length === 0) return <Loading />;

  if (forbidden) {
    return (
      <div className="space-y-4">
        <Link to="/educator/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
          <ArrowLeft size={16} /> My courses
        </Link>
        <Card>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300 py-8">
            You don&apos;t have access to reviews for this course.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/educator/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600">
        <ArrowLeft size={16} /> My courses
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {courseTitle ? <span className="font-medium text-gray-700 dark:text-gray-300">{courseTitle}</span> : 'Course'}{' '}
          · {total} review{total !== 1 ? 's' : ''}
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            No published reviews yet. When learners rate your course, they will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r._id} className="!p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{r.learner?.name || 'Learner'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i <= (r.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              </div>
              {r.title && <p className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">{r.title}</p>}
              {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{r.comment}</p>}

              {r.educatorReply && (
                <div className="mt-4 p-3 rounded-lg bg-primary-50/80 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-300 mb-1">Your reply</p>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{r.educatorReply}</p>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Reply publicly (learner is notified)</label>
                <textarea
                  className="input-field min-h-[88px] text-sm"
                  placeholder="Thank them or address their feedback…"
                  value={replyDrafts[r._id] ?? ''}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [r._id]: e.target.value }))}
                />
                <button
                  type="button"
                  disabled={savingId === r._id}
                  onClick={() => saveReply(r._id)}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  <Send size={14} />
                  {savingId === r._id ? 'Saving…' : 'Save reply'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
