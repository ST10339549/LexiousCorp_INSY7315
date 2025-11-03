/**
 * Handles Expo push notification registration for iOS and Android.
 * - Requests notification permissions
 * - Retrieves Expo Push Token
 * - Registers notification handlers (foreground + tap response)
 * - Saves push token to Firestore under user's document
 * 
 * @requires expo-notifications
 * @requires expo-device
 * @requires expo-constants
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

/**
 * Configure notification handler for foreground notifications
 * This determines how notifications are displayed when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // Show alert banner
    shouldPlaySound: true,       // Play notification sound
    shouldSetBadge: true,        // Update app badge count
  }),
});

/**
 * Register for push notifications and save token to Firestore
 * 
 * @param userId - The authenticated user's ID from Firebase Auth
 * @returns Promise<string | null> - The Expo Push Token or null if failed
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  try {
    // ========================================
    // STEP 1: Check if running on physical device
    // ========================================
    if (!Device.isDevice) {
      console.warn(
        '⚠️ Push notifications only work on physical devices, not simulators/emulators'
      );
      alert('Push notifications require a physical device.');
      return null;
    }

    // ========================================
    // STEP 2: Request notification permissions
    // ========================================
    console.log('📱 Requesting notification permissions...');
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not already granted, ask for permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Handle permission denial
    if (finalStatus !== 'granted') {
      console.warn('❌ Notification permissions denied');
      alert('Notification permissions are required to receive updates.');
      return null;
    }

    console.log('✅ Notification permissions granted');

    // ========================================
    // STEP 3: Configure Android notification channel
    // ========================================
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
      });
      console.log('🔔 Android notification channel configured');
    }

    // ========================================
    // STEP 4: Get Expo Push Token
    // ========================================
    console.log('🔑 Retrieving Expo Push Token...');
    
    // Get project ID from app config (set by EAS init)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('❌ No EAS project ID found. Run: npx eas init');
      return null;
    }
    
    console.log('📱 Using project ID:', projectId);
    
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const expoPushToken = tokenData.data;
    console.log('✅ Expo Push Token:', expoPushToken);

    // ========================================
    // STEP 5: Save token to Firestore
    // ========================================
    if (userId && expoPushToken) {
      try {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
          pushToken: expoPushToken,
          pushTokenUpdatedAt: new Date().toISOString(),
          devicePlatform: Platform.OS,
        });
        console.log('💾 Push token saved to Firestore');
      } catch (firestoreError) {
        console.error('❌ Failed to save token to Firestore:', firestoreError);
        // Don't throw - token is still valid even if Firestore save fails
      }
    }

    // ========================================
    // STEP 6: Register notification listeners
    // ========================================
    registerNotificationListeners();

    return expoPushToken;

  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
    
    if (error instanceof Error) {
      alert(`Failed to register for notifications: ${error.message}`);
    }
    
    return null;
  }
}

/**
 * Register listeners for notification events
 * - Foreground notifications (when app is open)
 * - Notification tap responses (when user taps notification)
 */
function registerNotificationListeners() {
  // ========================================
  // LISTENER 1: Foreground Notifications
  // ========================================
  // Triggered when a notification is received while app is in foreground
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('🔔 Notification received in foreground:', notification);
    console.log('📝 Title:', notification.request.content.title);
    console.log('📝 Body:', notification.request.content.body);
    console.log('📝 Data:', notification.request.content.data);
  });

  // ========================================
  // LISTENER 2: Notification Tap Response
  // ========================================
  // Triggered when user taps on a notification
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 User tapped notification:', response);
    console.log('📝 Notification data:', response.notification.request.content.data)
  });

  console.log('👂 Notification listeners registered');
}



/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('🗑️ All scheduled notifications cancelled');
}

/**
 * Get notification permissions status
 * 
 * @returns Promise<boolean> - true if permissions granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
