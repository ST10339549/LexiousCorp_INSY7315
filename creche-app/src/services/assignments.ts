
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Assignment data structure
 * Links a child to a staff member (teacher)
 */
export interface Assignment {
  id: string;
  childId: string;
  childName: string;
  staffId: string;
  staffName: string;
  assignedAt: Timestamp;
  assignedBy: string; // UID of admin who made the assignment
}

/**
 * Assign a child to a staff member
 * 
 * @param childId - Child's document ID
 * @param childName - Child's name
 * @param staffId - Staff member's UID
 * @param staffName - Staff member's name
 * @param adminId - Admin's UID who is making the assignment
 * @returns Promise<string> - Assignment document ID
 */
export async function assignChildToStaff(
  childId: string,
  childName: string,
  staffId: string,
  staffName: string,
  adminId: string
): Promise<string> {
  try {
    // Use composite ID to prevent duplicate assignments
    const assignmentId = `${staffId}_${childId}`;
    const assignmentRef = doc(db, "assignments", assignmentId);

    // Check if assignment already exists
    const existingAssignment = await getDoc(assignmentRef);
    if (existingAssignment.exists()) {
      console.log(`Assignment already exists: ${assignmentId}`);
      return assignmentId;
    }

    await setDoc(assignmentRef, {
      id: assignmentId,
      childId,
      childName,
      staffId,
      staffName,
      assignedAt: serverTimestamp(),
      assignedBy: adminId,
    });

    console.log(`✅ Child ${childName} assigned to ${staffName}`);
    return assignmentId;
  } catch (error) {
    console.error("❌ Error assigning child to staff:", error);
    throw error;
  }
}

/**
 * Remove a child assignment from a staff member
 * 
 * @param staffId - Staff member's UID
 * @param childId - Child's document ID
 * @returns Promise<void>
 */
export async function removeChildAssignment(
  staffId: string,
  childId: string
): Promise<void> {
  try {
    const assignmentId = `${staffId}_${childId}`;
    const assignmentRef = doc(db, "assignments", assignmentId);

    await deleteDoc(assignmentRef);
    console.log(`✅ Assignment removed: ${assignmentId}`);
  } catch (error) {
    console.error("❌ Error removing assignment:", error);
    throw error;
  }
}

/**
 * Get all children assigned to a specific staff member
 * 
 * @param staffId - Staff member's UID
 * @returns Promise<Assignment[]> - Array of assignments
 */
export async function getStaffAssignments(staffId: string): Promise<Assignment[]> {
  try {
    const assignmentsRef = collection(db, "assignments");
    const q = query(assignmentsRef, where("staffId", "==", staffId));
    const snapshot = await getDocs(q);

    const assignments: Assignment[] = [];
    snapshot.forEach((doc) => {
      assignments.push(doc.data() as Assignment);
    });

    // Sort by child name
    assignments.sort((a, b) => a.childName.localeCompare(b.childName));

    console.log(`✅ Found ${assignments.length} assignments for staff ${staffId}`);
    return assignments;
  } catch (error) {
    console.error("❌ Error fetching staff assignments:", error);
    throw error;
  }
}

/**
 * Get all assignments for all staff members
 * 
 * @returns Promise<Assignment[]> - Array of all assignments
 */
export async function getAllAssignments(): Promise<Assignment[]> {
  try {
    const assignmentsRef = collection(db, "assignments");
    const snapshot = await getDocs(assignmentsRef);

    const assignments: Assignment[] = [];
    snapshot.forEach((doc) => {
      assignments.push(doc.data() as Assignment);
    });

    // Sort by staff name, then child name
    assignments.sort((a, b) => {
      const staffCompare = a.staffName.localeCompare(b.staffName);
      if (staffCompare !== 0) return staffCompare;
      return a.childName.localeCompare(b.childName);
    });

    console.log(`✅ Found ${assignments.length} total assignments`);
    return assignments;
  } catch (error) {
    console.error("❌ Error fetching all assignments:", error);
    throw error;
  }
}

/**
 * Get the staff member assigned to a specific child
 * 
 * @param childId - Child's document ID
 * @returns Promise<Assignment | null> - Assignment if exists, null otherwise
 */
export async function getChildAssignment(childId: string): Promise<Assignment | null> {
  try {
    const assignmentsRef = collection(db, "assignments");
    const q = query(assignmentsRef, where("childId", "==", childId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No assignment found for child ${childId}`);
      return null;
    }

    const assignment = snapshot.docs[0].data() as Assignment;
    console.log(`✅ Child ${childId} is assigned to ${assignment.staffName}`);
    return assignment;
  } catch (error) {
    console.error("❌ Error fetching child assignment:", error);
    throw error;
  }
}

/**
 * Reassign a child from one staff member to another
 * 
 * @param childId - Child's document ID
 * @param childName - Child's name
 * @param oldStaffId - Current staff member's UID
 * @param newStaffId - New staff member's UID
 * @param newStaffName - New staff member's name
 * @param adminId - Admin's UID making the reassignment
 * @returns Promise<string> - New assignment ID
 */
export async function reassignChild(
  childId: string,
  childName: string,
  oldStaffId: string,
  newStaffId: string,
  newStaffName: string,
  adminId: string
): Promise<string> {
  try {
    // Remove old assignment
    await removeChildAssignment(oldStaffId, childId);

    // Create new assignment
    const newAssignmentId = await assignChildToStaff(
      childId,
      childName,
      newStaffId,
      newStaffName,
      adminId
    );

    console.log(`✅ Child ${childName} reassigned to ${newStaffName}`);
    return newAssignmentId;
  } catch (error) {
    console.error("❌ Error reassigning child:", error);
    throw error;
  }
}

/**
 * Get count of children assigned to a staff member
 * 
 * @param staffId - Staff member's UID
 * @returns Promise<number> - Count of assigned children
 */
export async function getStaffAssignmentCount(staffId: string): Promise<number> {
  try {
    const assignments = await getStaffAssignments(staffId);
    return assignments.length;
  } catch (error) {
    console.error("❌ Error getting assignment count:", error);
    return 0;
  }
}
