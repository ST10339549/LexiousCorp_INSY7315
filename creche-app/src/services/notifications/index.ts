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
  type ExpoPushMessage,
} from './sendNotification';
