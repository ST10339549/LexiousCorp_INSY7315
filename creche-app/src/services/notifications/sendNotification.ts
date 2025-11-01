/**
 * Sends push notifications using the Expo Push Notification API.
 * This file handles sending notifications to specific users via their Expo Push Tokens.
 * Uses Expo's free push notification service (no Firebase Cloud Messaging needed)
 * 
 * @see https://docs.expo.dev/push-notifications/sending-notifications/
 */

/**
 * Expo Push Notification Message Structure
 */
export interface ExpoPushMessage {
  to: string | string[];              // Expo Push Token(s)
  title: string;                      // Notification title
  body: string;                       // Notification body
  data?: Record<string, any>;         // Custom data payload
  sound?: 'default' | null;           // Notification sound
  badge?: number;                     // iOS badge count
  channelId?: string;                 // Android notification channel
  priority?: 'default' | 'normal' | 'high'; // Priority level
  ttl?: number;                       // Time to live (seconds)
}

/**
 * Expo Push Notification API Response
 */
interface ExpoPushReceipt {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: any;
}

/**
 * Send a push notification via Expo Push API
 * 
 * @param pushToken - The recipient's Expo Push Token (e.g., "ExponentPushToken[xxxxx]")
 * @param title - Notification title
 * @param body - Notification body/message
 * @param data - Optional custom data payload
 * @returns Promise<boolean> - true if notification sent successfully
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    // ========================================
    // STEP 1: Validate push token
    // ========================================
    if (!pushToken || !pushToken.startsWith('ExponentPushToken[')) {
      console.error('❌ Invalid Expo Push Token:', pushToken);
      return false;
    }

    console.log('📤 Sending push notification...');
    console.log('📍 To:', pushToken);
    console.log('📝 Title:', title);
    console.log('📝 Body:', body);

    // ========================================
    // STEP 2: Construct notification message
    // ========================================
    const message: ExpoPushMessage = {
      to: pushToken,
      title,
      body,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
      data: data || {},
    };

    // ========================================
    // STEP 3: Send notification via Expo API
    // ========================================
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    // ========================================
    // STEP 4: Parse response
    // ========================================
    const result = await response.json();
    console.log('📬 Expo API Response:', result);

    // Check if notification was accepted
    // Response can be either result.data (single) or result.data[0] (array)
    const receipt: ExpoPushReceipt = Array.isArray(result.data) 
      ? result.data[0] 
      : result.data;
    
    if (receipt && receipt.status === 'ok') {
      console.log('✅ Notification sent successfully!');
      console.log('📨 Ticket ID:', receipt.id);
      return true;
    } else if (receipt && receipt.status === 'error') {
      console.error('❌ Notification failed:', receipt.message);
      console.error('📋 Details:', receipt.details);
      return false;
    }

    console.error('❌ Unexpected response format:', result);
    return false;

  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    
    if (error instanceof Error) {
      console.error('📋 Error details:', error.message);
    }
    
    return false;
  }
}

/**
 * Send a notification to multiple users at once (batch send)
 * 
 * @param pushTokens - Array of Expo Push Tokens
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional custom data payload
 * @returns Promise<number> - Number of successfully sent notifications
 */
export async function sendBatchNotifications(
  pushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<number> {
  try {
    console.log(`📤 Sending batch notifications to ${pushTokens.length} recipients...`);

    // Filter out invalid tokens
    const validTokens = pushTokens.filter(token => 
      token && token.startsWith('ExponentPushToken[')
    );

    if (validTokens.length === 0) {
      console.warn('⚠️ No valid push tokens found');
      return 0;
    }

    // ========================================
    // Construct batch message
    // ========================================
    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      title,
      body,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
      data: data || {},
    }));

    // ========================================
    // Send batch request to Expo API
    // ========================================
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log('📬 Batch notification response:', result);

    // Count successful sends
    let successCount = 0;
    if (result.data && Array.isArray(result.data)) {
      successCount = result.data.filter(
        (receipt: ExpoPushReceipt) => receipt.status === 'ok'
      ).length;
    }

    console.log(`✅ Successfully sent ${successCount}/${validTokens.length} notifications`);
    return successCount;

  } catch (error) {
    console.error('❌ Error sending batch notifications:', error);
    return 0;
  }
}

/**
 * Send a test notification to the current user
 * 
 * @param pushToken - User's Expo Push Token
 * @returns Promise<boolean> - true if successful
 */
export async function sendTestNotification(
  pushToken: string
): Promise<boolean> {
  return sendPushNotification(
    pushToken,
    '🧪 Test Notification',
    'This is a test notification from your Creche App!',
    {
      type: 'test',
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Send attendance reminder notification
 * 
 * @param pushToken - Parent's Expo Push Token
 * @param childName - Child's name
 * @returns Promise<boolean>
 */
export async function sendAttendanceReminder(
  pushToken: string,
  childName: string
): Promise<boolean> {
  return sendPushNotification(
    pushToken,
    '📋 Attendance Reminder',
    `Please mark attendance for ${childName}`,
    {
      type: 'attendance_reminder',
      childName,
      screen: 'Attendance',
    }
  );
}

/**
 * Send child pickup notification
 * 
 * @param pushToken - Parent's Expo Push Token
 * @param childName - Child's name
 * @param time - Pickup time
 * @returns Promise<boolean>
 */
export async function sendPickupNotification(
  pushToken: string,
  childName: string,
  time: string
): Promise<boolean> {
  return sendPushNotification(
    pushToken,
    '👋 Pickup Notification',
    `${childName} is ready for pickup at ${time}`,
    {
      type: 'pickup',
      childName,
      time,
      screen: 'ParentHome',
    }
  );
}

/**
 * Send emergency alert to all parents
 * 
 * @param pushTokens - Array of parent push tokens
 * @param message - Emergency message
 * @returns Promise<number> - Count of successful sends
 */
export async function sendEmergencyAlert(
  pushTokens: string[],
  message: string
): Promise<number> {
  return sendBatchNotifications(
    pushTokens,
    '🚨 EMERGENCY ALERT',
    message,
    {
      type: 'emergency',
      priority: 'urgent',
      timestamp: new Date().toISOString(),
    }
  );
}
