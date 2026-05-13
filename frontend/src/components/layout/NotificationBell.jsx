import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import { notificationHref } from '../../utils/notificationLinks';

export default function NotificationBell() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const {
    notifications,
    unreadCount,
    markRead,
    fetchUnreadCount,
    fetchNotifications,
  } = useNotifications();

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      fetchNotifications(1);
      fetchUnreadCount();
    }
  };

  const onItemClick = async (n) => {
    if (!n.isRead) await markRead(n._id);
    setOpen(false);
    const href = notificationHref(n, user?.role);
    if (href && href !== '/notifications') nav(href);
    else nav('/notifications');
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={toggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[min(420px,70vh)] overflow-hidden flex flex-col rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl z-[60] animate-fade-in-up">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
            <Link
              to="/notifications"
              className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-sm text-gray-500 text-center">You&apos;re all caught up.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.slice(0, 8).map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => onItemClick(n)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !n.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                      }`}
                    >
                      <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{n.title}</p>
                      {n.message && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">{n.message}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
