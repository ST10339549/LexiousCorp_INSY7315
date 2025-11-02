
/**
 * AppNavigator
 * 
 * Handles role-based navigation after user login.
 * Fetches user document from Firestore and routes based on role:
 * - admin -> AdminDashboard
 * - staff -> StaffDashboard  
 * - parent -> ParentHome
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Role, User } from "../types/user";

export interface NavigationResult {
  role: Role;
  userName: string;
  userId: string;
}

/**
 * Fetches user data and determines navigation route based on role
 * 
 * @param uid - Firebase Auth user ID
 * @returns NavigationResult with role, userName, and userId
 * @throws Error if user document not found or role is invalid
 */
export async function getUserNavigationData(uid: string): Promise<NavigationResult> {
  try {
    console.log(`[AppNavigator] Fetching user document for uid: ${uid}`);
    
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User record not found in database. Please contact admin.");
    }

    const userData = userDoc.data() as User;
    const role = userData.role;
    const userName = userData.name || "User";

    console.log(`[AppNavigator] User role: ${role}`);

    // Validate role
    const validRoles: Role[] = ['admin', 'staff', 'parent'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Please contact admin.`);
    }

    return {
      role,
      userName,
      userId: uid,
    };
  } catch (error) {
    console.error("[AppNavigator] Error fetching user navigation data:", error);
    throw error;
  }
}

/**
 * Maps role to screen name
 * 
 * @param role - User role
 * @returns Screen name for the role
 */
export function getScreenForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return 'AdminDashboard';
    case 'staff':
      return 'StaffDashboard';
    case 'parent':
      return 'ParentHome';
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}

/**
 * Helper to determine if a role has admin privileges
 */
export function hasAdminPrivileges(role: Role): boolean {
  return role === 'admin';
}

/**
 * Helper to determine if a role has staff privileges
 */
export function hasStaffPrivileges(role: Role): boolean {
  return role === 'admin' || role === 'staff';
}

/**
 * Helper to determine if a role can take attendance
 */
export function canTakeAttendance(role: Role): boolean {
  return role === 'admin' || role === 'staff';
}

/**
 * Helper to determine if a role can add children
 */
export function canAddChildren(role: Role): boolean {
  return role === 'admin' || role === 'parent';
}
