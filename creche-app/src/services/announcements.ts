/**
 * Announcements Service
 * 
 * Manages announcements in the Firestore 'announcements' collection.
 * Supports creating, listing, and subscribing to announcements.
 */

import {
  collection,
  addDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { sendBatchNotifications } from "./notifications/sendNotification";
import { collection as firestoreCollection, getDocs as firestoreGetDocs } from "firebase/firestore";

/**
 * Announcement audience type
 */
export type AnnouncementAudience = 'all' | 'parents' | 'staff' | 'admin';

/**
 * Announcement data structure
 */
export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: AnnouncementAudience;
  createdAt: Timestamp;
}

/**
 * Input data for creating an announcement
 */
export interface CreateAnnouncementData {
  title: string;
  body: string;
  audience: AnnouncementAudience;
}

/**
 * Creates a new announcement in Firestore and sends push notifications
 * to the targeted audience.
 * 
 * @param data - Announcement data (title, body, audience)
 * @returns Promise<string> - The ID of the created announcement document
 * @throws Error if required fields are missing
 */
export async function createAnnouncement(
  data: CreateAnnouncementData
): Promise<string> {
  // Validate required fields
  if (!data.title || !data.body || !data.audience) {
    throw new Error("Missing required fields: title, body, and audience are required");
  }

  // Validate audience
  const validAudiences: AnnouncementAudience[] = ['all', 'parents', 'staff'];
  if (!validAudiences.includes(data.audience)) {
    throw new Error(
      `Invalid audience: ${data.audience}. Must be one of: ${validAudiences.join(', ')}`
    );
  }

  try {
    console.log('📢 Creating announcement:', data.title);

    // Create announcement document
    const announcementsRef = collection(db, "announcements");
    const docRef = await addDoc(announcementsRef, {
      title: data.title.trim(),
      body: data.body.trim(),
      audience: data.audience,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Announcement created with ID:', docRef.id);

    // Send push notifications to targeted audience
    await sendAnnouncementNotifications(data.title, data.body, data.audience);

    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating announcement:", error);
    throw error;
  }
}

/**
 * Sends push notifications to users based on announcement audience
 * 
 * @param title - Notification title
 * @param body - Notification body
 * @param audience - Target audience
 */
async function sendAnnouncementNotifications(
  title: string,
  body: string,
  audience: AnnouncementAudience
): Promise<void> {
  try {
    console.log(`📤 Sending notifications to audience: ${audience}`);

    // Fetch users based on audience
    const usersRef = collection(db, "users");
    let usersQuery;

    if (audience === 'all') {
      // Send to all users
      usersQuery = query(usersRef);
    } else if (audience === 'parents') {
      // Send to parents only
      usersQuery = query(usersRef, where("role", "==", "parent"));
    } else if (audience === 'staff') {
      // Send to staff and admin
      usersQuery = query(usersRef, where("role", "in", ["staff", "admin"]));
    } else {
      return;
    }

    const usersSnapshot = await getDocs(usersQuery);
    const pushTokens: string[] = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.pushToken) {
        pushTokens.push(userData.pushToken);
      }
    });

    if (pushTokens.length === 0) {
      console.warn('⚠️ No users found with push tokens for audience:', audience);
      return;
    }

    console.log(`📨 Sending to ${pushTokens.length} users`);

    // Send batch notifications
    const successCount = await sendBatchNotifications(
      pushTokens,
      `📢 ${title}`,
      body,
      {
        type: 'announcement',
        audience,
        timestamp: new Date().toISOString(),
      }
    );

    console.log(`✅ Sent ${successCount}/${pushTokens.length} notifications successfully`);
  } catch (error) {
    console.error("❌ Error sending announcement notifications:", error);
    // Don't throw - announcement was already created
  }
}

/**
 * Fetches a list of announcements, sorted by creation date (newest first)
 * 
 * @param limitCount - Optional limit on number of announcements to fetch
 * @param audience - Optional filter by audience
 * @returns Promise<Announcement[]> - Array of announcements
 */
export async function listAnnouncements(
  limitCount?: number,
  audience?: AnnouncementAudience
): Promise<Announcement[]> {
  try {
    const announcementsRef = collection(db, "announcements");

    let q = query(
      announcementsRef,
      orderBy("createdAt", "desc")
    );

    // Apply limit if specified
    if (limitCount) {
      q = query(q, firestoreLimit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const announcements: Announcement[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by audience in memory if specified
      if (!audience || data.audience === audience || data.audience === "all") {
        announcements.push({
          id: doc.id,
          ...data,
        } as Announcement);
      }
    });

    console.log(`📋 Fetched ${announcements.length} announcements`);
    return announcements;
  } catch (error) {
    console.error("❌ Error fetching announcements:", error);
    throw error;
  }
}

/**
 * Subscribes to real-time updates for announcements
 * 
 * @param callback - Callback function to receive announcement updates
 * @param limitCount - Optional limit on number of announcements
 * @param audience - Optional filter by audience
 * @returns Unsubscribe function
 */
export function subscribeAnnouncements(
  callback: (announcements: Announcement[]) => void,
  limitCount?: number,
  audience?: AnnouncementAudience
): () => void {
  try {
    const announcementsRef = collection(db, "announcements");

    let q = query(
      announcementsRef,
      orderBy("createdAt", "desc")
    );

    // Apply limit if specified
    if (limitCount) {
      q = query(q, firestoreLimit(limitCount));
    }

    console.log('👂 Subscribing to announcements...');

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const announcements: Announcement[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Filter by audience in memory if specified
          if (!audience || data.audience === audience || data.audience === "all") {
            announcements.push({
              id: doc.id,
              ...data,
            } as Announcement);
          }
        });

        console.log(`📢 Received ${announcements.length} announcements update`);
        callback(announcements);
      },
      (error) => {
        console.error("❌ Error in announcements subscription:", error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error setting up announcements subscription:", error);
    throw error;
  }
}
