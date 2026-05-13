import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, CheckCheck } from 'lucide-react';
import usePageTitle from '../hooks/usePageTitle';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { notificationHref } from '../utils/notificationLinks';
import Loading from '../components/ui/Loading';

export default function Notifications() {
  usePageTitle('Notifications');
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    removeNotification,
    loadMore,
    hasMore,
  } = useNotifications();

  const openNotification = async (n) => {
    if (!n.isRead) await markRead(n._id);
    const href = notificationHref(n, user?.role);
    if (href && href !== '/notifications') nav(href);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await removeNotification(id);
    } catch {
      toast.error('Could not remove notification');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllRead();
      toast.success('All marked as read');
    } catch {
      toast.error('Could not update notifications');
    }
  };

  if (loading && notifications.length === 0) return <Loading />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {notifications.length > 0 && unreadCount > 0 && (
          <button type="button" onClick={handleMarkAll} className="btn-secondary text-sm inline-flex items-center gap-2">
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-14 text-gray-500 dark:text-gray-400 text-sm">
          No notifications yet. We&apos;ll show enrollments, reviews, payouts, and class updates here.
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n._id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => openNotification(n)}
                onKeyDown={(e) => e.key === 'Enter' && openNotification(n)}
                className={`card !p-4 flex gap-3 cursor-pointer transition-colors hover:border-primary-200 dark:hover:border-primary-800 ${
                  !n.isRead ? 'border-primary-200/80 dark:border-primary-800/40 bg-primary-50/30 dark:bg-primary-950/20' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{n.title}</p>
                  {n.message && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleDelete(n._id, e)}
                  className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label="Delete notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button type="button" onClick={loadMore} className="btn-secondary text-sm">
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
