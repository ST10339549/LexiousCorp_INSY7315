import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { sendAbsenceNotification } from "./notifications";

/**
 * Attendance status type
 */
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

/**
 * Attendance record structure
 */
export type AttendanceRecord = {
  id: string;
  childId: string;
  childName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  timestamp: Timestamp;
  markedBy: string; // UID of admin/teacher who marked attendance
  notes?: string;
};

/**
 * Mark attendance for a child
 * 
 * @param childId - Child's document ID
 * @param status - Attendance status
 * @param date - Date in YYYY-MM-DD format
 * @param markedBy - UID of user marking attendance
 * @param childName - Child's name for notification
 * @param notes - Optional notes
 */
export async function markAttendance(
  childId: string,
  status: AttendanceStatus,
  date: string,
  markedBy: string,
  childName: string,
  notes?: string
): Promise<void> {
  try {
    // Create attendance record in Firestore
    const attendanceId = `${childId}_${date}`;
    const attendanceRef = doc(db, "attendance", attendanceId);
    
    await setDoc(
      attendanceRef,
      {
        childId,
        childName,
        status,
        date,
        timestamp: serverTimestamp(),
        markedBy,
        notes: notes || "",
      },
      { merge: true }
    );

    console.log(`✅ Attendance marked for ${childName}: ${status}`);

    // Handle notifications based on attendance status
    console.log(`[Attendance] Checking status: ${status}, isAbsent: ${status === "absent"}`);
    
    if (status === "absent") {
      console.log(`[Attendance] Child marked ABSENT - triggering notification for ${childName}`);
      // Send absence notification to parent if child is marked absent
      try {
        // Fetch child's parent information
        const childRef = doc(db, "children", childId);
        const childDoc = await getDoc(childRef);
        
        if (!childDoc.exists()) {
          console.warn(`⚠️ Child document not found for ${childName}`);
          return;
        }
        
        const childData = childDoc.data();
        const parentId = childData.parentId;
        
        if (!parentId) {
          console.warn(`⚠️ No parentId found for ${childName}`);
          return;
        }
        
        // Fetch parent's push token
        const parentRef = doc(db, "users", parentId);
        const parentDoc = await getDoc(parentRef);
        
        if (!parentDoc.exists()) {
          console.warn(`⚠️ Parent document not found for ${childName}`);
          return;
        }
        
        const parentData = parentDoc.data();
        const pushToken = parentData.pushToken;
        
        if (!pushToken) {
          console.warn(`⚠️ No push token found for parent of ${childName}`);
          return;
        }
        
        // Format date for notification
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        // Send push notification
        const notificationSent = await sendAbsenceNotification(
          pushToken,
          childName,
          formattedDate
        );
        
        if (notificationSent) {
          console.log(`📲 Absence notification sent to parent for ${childName}`);
          
          // Store notification in Firestore for in-app display
          // Use deterministic ID so we can update existing notifications
          const notificationId = `absence_${childId}_${date}`;
          const notificationRef = doc(db, "notifications", notificationId);
          
          console.log(`[Attendance] Creating notification with ID: ${notificationId}`);
          console.log(`[Attendance] ChildId: ${childId}, Date: ${date}`);
          console.log(`💾 Creating/Updating notification ${notificationId} with read=false`);
          
          // Always overwrite the entire document to ensure timestamp updates
          await setDoc(notificationRef, {
            parentId,
            childId,
            childName,
            type: "absence_alert",
            title: "⚠️ Child Absence Alert",
            message: `${childName} has been marked absent on ${formattedDate}`,
            date,
            timestamp: serverTimestamp(),
            read: false, // Always reset to unread when absence is marked
            updatedAt: serverTimestamp(), // Add extra timestamp to force update
          }, { merge: false }); // Use merge: false to completely overwrite
          
          console.log(`✅ Notification stored/updated in Firestore for in-app display`);
        }
      } catch (notificationError) {
        console.error("❌ Error sending absence notification:", notificationError);
        console.error("❌ Error details:", {
          name: (notificationError as Error).name,
          message: (notificationError as Error).message,
          code: (notificationError as any).code
        });
        // Don't throw - attendance was still marked successfully
      }
    } else {
      // If status is not absent (present, late, excused), remove the absence notification
      try {
        const notificationId = `absence_${childId}_${date}`;
        const notificationRef = doc(db, "notifications", notificationId);
        await deleteDoc(notificationRef);
        console.log(`🗑️ Absence notification removed for ${childName} (now ${status})`);
      } catch (error) {
        // Notification might not exist, which is fine
        console.log(`ℹ️ No absence notification to remove for ${childName}`);
      }
    }
  } catch (error) {
    console.error("❌ Error marking attendance:", error);
    throw error;
  }
}

/**
 * Fetch attendance records for a specific date (placeholder)
 * 
 * @param date - Date in YYYY-MM-DD format
 * @returns Array of attendance records
 */
export async function fetchAttendanceByDate(
  date: string
): Promise<AttendanceRecord[]> {
  // TODO: Implement attendance fetching logic
  console.log("TODO: Implement fetchAttendanceByDate", { date });
  return [];
}

/**
 * Fetch attendance history for a child (placeholder)
 * 
 * @param childId - Child's document ID
 * @param startDate - Start date (optional)
 * @param endDate - End date (optional)
 * @returns Array of attendance records
 */
export async function fetchChildAttendanceHistory(
  childId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  // TODO: Implement child attendance history logic
  console.log("TODO: Implement fetchChildAttendanceHistory", {
    childId,
    startDate,
    endDate,
  });
  return [];
}
