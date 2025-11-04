/**
 * Central export point for all notification-related services
 */

export {
  registerForPushNotifications,

  cancelAllNotifications,
  checkNotificationPermissions,
} from './registerForPushNotifications';

export {
  sendPushNotification,
  sendBatchNotifications,

  sendAttendanceReminder,
  sendPickupNotification,
  sendEmergencyAlert,
  sendAbsenceNotification,
  type ExpoPushMessage,
} from './sendNotification';

export {
  listenParentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from './notificationListener';
