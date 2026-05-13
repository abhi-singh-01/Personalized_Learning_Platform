import { isEducatorRole } from './rolePaths';

/**
 * Best-effort deep link from a notification for the current user role.
 */
export function notificationHref(notification, userRole) {
  const d = notification?.data || {};
  const courseId = d.courseId || d.course?._id;
  const classId = d.classId || d.liveClassId;

  if (isEducatorRole(userRole)) {
    if (notification.type === 'review_received' && courseId) {
      return `/educator/courses/${courseId}/reviews`;
    }
    if (['payout_processed', 'payout_failed', 'payment_received'].includes(notification.type)) {
      return '/educator/earnings';
    }
    if (['class_starting', 'class_ended', 'class_cancelled'].includes(notification.type)) {
      return '/educator/live-classes';
    }
    if (['enrollment', 'unenrollment'].includes(notification.type) && courseId) {
      return `/educator/courses/${courseId}/edit`;
    }
    return '/notifications';
  }

  if (notification.type === 'review_reply' && courseId) {
    return `/learner/courses/${courseId}`;
  }
  if (['class_starting', 'class_ended'].includes(notification.type) && classId) {
    return `/learner/live-class/${classId}`;
  }
  if (['new_material', 'new_quiz', 'quiz_deadline'].includes(notification.type) && courseId) {
    return `/learner/courses/${courseId}`;
  }
  return '/notifications';
}
