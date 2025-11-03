/**
 * Events Service
 * 
 * Manages events in the Firestore 'events' collection.
 * Supports creating, updating, deleting, listing, and subscribing to events.
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { sendBatchNotifications } from "./notifications/sendNotification";

/**
 * Event data structure stored in Firestore
 */
export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD format
  startsAt: string; // Time string (e.g., "09:00")
  endsAt: string; // Time string (e.g., "11:00")
  location: string;
  createdBy: string;
  createdAt: Timestamp;
}

/**
 * Input data for creating an event
 */
export interface CreateEventData {
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startsAt: string;
  endsAt: string;
  location: string;
  createdBy: string;
}

/**
 * Input data for updating an event
 */
export interface UpdateEventData {
  title?: string;
  description?: string;
  date?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
}

/**
 * Creates a new event in Firestore and optionally sends notifications to parents
 * 
 * @param data - Event data
 * @param sendNotification - Whether to send push notifications to parents (default: true)
 * @returns Promise<string> - The ID of the created event document
 * @throws Error if required fields are missing or validation fails
 */
export async function createEvent(
  data: CreateEventData,
  sendNotification: boolean = true
): Promise<string> {
  // Validate required fields
  if (!data.title || !data.description || !data.date || !data.startsAt || !data.endsAt || !data.location || !data.createdBy) {
    throw new Error("Missing required fields: all fields (title, description, date, startsAt, endsAt, location, createdBy) are required");
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD");
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(data.startsAt) || !timeRegex.test(data.endsAt)) {
    throw new Error("Invalid time format. Expected HH:MM");
  }

  try {
    console.log('📅 Creating event:', data.title);

    // Create event document
    const eventsRef = collection(db, "events");
    const docRef = await addDoc(eventsRef, {
      title: data.title.trim(),
      description: data.description.trim(),
      date: data.date,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      location: data.location.trim(),
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Event created with ID:', docRef.id);

    // Send push notifications to parents
    if (sendNotification) {
      await sendEventNotification(data.title, data.description, data.date, data.startsAt);
    }

    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating event:", error);
    throw error;
  }
}

/**
 * Updates an existing event in Firestore
 * 
 * @param eventId - The ID of the event to update
 * @param data - Partial event data to update
 * @throws Error if validation fails
 */
export async function updateEvent(
  eventId: string,
  data: UpdateEventData
): Promise<void> {
  if (!eventId) {
    throw new Error("Event ID is required");
  }

  // Validate date format if provided
  if (data.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      throw new Error("Invalid date format. Expected YYYY-MM-DD");
    }
  }

  // Validate time format if provided
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (data.startsAt && !timeRegex.test(data.startsAt)) {
    throw new Error("Invalid startsAt time format. Expected HH:MM");
  }
  if (data.endsAt && !timeRegex.test(data.endsAt)) {
    throw new Error("Invalid endsAt time format. Expected HH:MM");
  }

  try {
    console.log('📝 Updating event:', eventId);

    const eventRef = doc(db, "events", eventId);
    const updateData: any = {};

    if (data.title) updateData.title = data.title.trim();
    if (data.description) updateData.description = data.description.trim();
    if (data.date) updateData.date = data.date;
    if (data.startsAt) updateData.startsAt = data.startsAt;
    if (data.endsAt) updateData.endsAt = data.endsAt;
    if (data.location) updateData.location = data.location.trim();

    await updateDoc(eventRef, updateData);

    console.log('✅ Event updated successfully');
  } catch (error) {
    console.error("❌ Error updating event:", error);
    throw error;
  }
}

/**
 * Deletes an event from Firestore
 * 
 * @param eventId - The ID of the event to delete
 */
export async function deleteEvent(eventId: string): Promise<void> {
  if (!eventId) {
    throw new Error("Event ID is required");
  }

  try {
    console.log('🗑️ Deleting event:', eventId);

    const eventRef = doc(db, "events", eventId);
    await deleteDoc(eventRef);

    console.log('✅ Event deleted successfully');
  } catch (error) {
    console.error("❌ Error deleting event:", error);
    throw error;
  }
}

/**
 * Lists events within an optional date range
 * 
 * @param startDate - Optional start date (YYYY-MM-DD) - defaults to today
 * @param endDate - Optional end date (YYYY-MM-DD) - defaults to 3 months from now
 * @returns Promise<Event[]> - Array of events
 */
export async function listEvents(
  startDate?: string,
  endDate?: string
): Promise<Event[]> {
  try {
    console.log('📋 Listing events', startDate ? `from ${startDate}` : '', endDate ? `to ${endDate}` : '');

    const eventsRef = collection(db, "events");
    let eventsQuery;

    if (startDate && endDate) {
      // Query events within date range
      eventsQuery = query(
        eventsRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
      );
    } else if (startDate) {
      // Query events from startDate onwards
      eventsQuery = query(
        eventsRef,
        where("date", ">=", startDate),
        orderBy("date", "asc")
      );
    } else if (endDate) {
      // Query events up to endDate
      eventsQuery = query(
        eventsRef,
        where("date", "<=", endDate),
        orderBy("date", "asc")
      );
    } else {
      // Query all events, ordered by date
      eventsQuery = query(
        eventsRef,
        orderBy("date", "asc")
      );
    }

    const snapshot = await getDocs(eventsQuery);
    const events: Event[] = [];

    snapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data(),
      } as Event);
    });

    // Sort by startsAt time within each date (client-side sorting)
    events.sort((a, b) => {
      if (a.date === b.date) {
        return a.startsAt.localeCompare(b.startsAt);
      }
      return a.date.localeCompare(b.date);
    });

    console.log(`✅ Found ${events.length} events`);
    return events;
  } catch (error) {
    console.error("❌ Error listing events:", error);
    throw error;
  }
}

/**
 * Subscribes to real-time updates for events
 * 
 * @param callback - Function called when events update
 * @param startDate - Optional start date filter (YYYY-MM-DD)
 * @param endDate - Optional end date filter (YYYY-MM-DD)
 * @returns Unsubscribe function
 */
export function subscribeEvents(
  callback: (events: Event[]) => void,
  startDate?: string,
  endDate?: string
): () => void {
  console.log('🔔 Subscribing to events', startDate ? `from ${startDate}` : '', endDate ? `to ${endDate}` : '');

  const eventsRef = collection(db, "events");
  let eventsQuery;

  if (startDate && endDate) {
    eventsQuery = query(
      eventsRef,
      where("date", ">=", startDate),
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
  } else if (startDate) {
    eventsQuery = query(
      eventsRef,
      where("date", ">=", startDate),
      orderBy("date", "asc")
    );
  } else if (endDate) {
    eventsQuery = query(
      eventsRef,
      where("date", "<=", endDate),
      orderBy("date", "asc")
    );
  } else {
    eventsQuery = query(
      eventsRef,
      orderBy("date", "asc")
    );
  }

  const unsubscribe = onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events: Event[] = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data(),
        } as Event);
      });
      
      // Sort by startsAt time within each date (client-side sorting)
      events.sort((a, b) => {
        if (a.date === b.date) {
          return a.startsAt.localeCompare(b.startsAt);
        }
        return a.date.localeCompare(b.date);
      });
      
      console.log(`📥 Events updated: ${events.length} events`);
      callback(events);
    },
    (error) => {
      console.error("❌ Error in events subscription:", error);
    }
  );

  return unsubscribe;
}

/**
 * Sends push notifications to parents about a new event
 * 
 * @param title - Event title
 * @param description - Event description
 * @param date - Event date
 * @param startsAt - Event start time
 */
async function sendEventNotification(
  title: string,
  description: string,
  date: string,
  startsAt: string
): Promise<void> {
  try {
    console.log(`📤 Sending event notifications to parents`);

    // Fetch all parent users
    const usersRef = collection(db, "users");
    const parentsQuery = query(usersRef, where("role", "==", "parent"));
    const usersSnapshot = await getDocs(parentsQuery);
    const pushTokens: string[] = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.pushToken) {
        pushTokens.push(userData.pushToken);
      }
    });

    if (pushTokens.length === 0) {
      console.warn('⚠️ No parents found with push tokens');
      return;
    }

    console.log(`📨 Sending event notification to ${pushTokens.length} parents`);

    // Format date for notification
    const eventDate = new Date(date);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Send batch notifications
    const successCount = await sendBatchNotifications(
      pushTokens,
      `📅 New Event: ${title}`,
      `${formattedDate} at ${startsAt} - ${description.substring(0, 100)}${description.length > 100 ? '...' : ''}`
    );

    console.log(`✅ Sent ${successCount} event notifications`);
  } catch (error) {
    console.error("❌ Error sending event notifications:", error);
    // Don't throw - event creation should succeed even if notifications fail
  }
}
