/**
 * Central export point for all notification-related services
 */

export {
  registerForPushNotifications,
  scheduleLocalNotification,
  cancelAllNotifications,
  checkNotificationPermissions,
} from './registerForPushNotifications';

export {
  sendPushNotification,
  sendBatchNotifications,
  sendTestNotification,
  sendAttendanceReminder,
  sendPickupNotification,
  sendEmergencyAlert,
  type ExpoPushMessage,
} from './sendNotification';
