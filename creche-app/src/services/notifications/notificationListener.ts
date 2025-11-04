/**
 * Service for listening to and managing in-app notifications
 */

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../../firebase";

/**
 * Notification data structure
 */
export type Notification = {
  id: string;
  parentId: string;
  childId: string;
  childName: string;
  type: "absence_alert" | "attendance_reminder" | "pickup" | "emergency" | "general";
  title: string;
  message: string;
  date: string;
  timestamp: Timestamp;
  read: boolean;
};

/**
 * Listen to notifications for a specific parent (real-time updates)
 * 
 * @param parentId - Parent's UID
 * @param callback - Function called with updated notifications array
 * @returns Unsubscribe function
 */
export function listenParentNotifications(
  parentId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("parentId", "==", parentId),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: Notification[] = [];
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as Notification);
      });

      console.log(`[listenParentNotifications] Found ${notifications.length} notifications for parent ${parentId}`);
      callback(notifications);
    },
    (error) => {
      console.error("Error listening to notifications:", error);
      callback([]);
    }
  );
}

/**
 * Mark a notification as read
 * 
 * @param notificationId - Notification's document ID
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
    console.log(`✅ Notification ${notificationId} marked as read`);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    throw error;
  }
}

/**
 * Mark all notifications for a parent as read
 * 
 * @param notifications - Array of notifications to mark as read
 */
export async function markAllNotificationsAsRead(
  notifications: Notification[]
): Promise<void> {
  try {
    const updatePromises = notifications
      .filter((n) => !n.read)
      .map((n) => markNotificationAsRead(n.id));
    
    await Promise.all(updatePromises);
    console.log(`✅ Marked ${updatePromises.length} notifications as read`);
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    throw error;
  }
}
