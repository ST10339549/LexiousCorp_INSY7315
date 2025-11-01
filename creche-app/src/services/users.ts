
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Role, User } from "../types/user";

/**
 * Input data for creating a user document
 */
export interface CreateUserData {
  name: string;
  email: string;
  role: Role;
}

/**
 * Creates a user document in Firestore with required fields
 * 
 * @param uid - The user's Firebase Auth UID
 * @param data - User data containing name, email, and role
 * @returns Promise<void>
 * @throws Error if any required field is missing
 */
export async function createUserDoc(
  uid: string,
  data: CreateUserData
): Promise<void> {
  // Validate required fields
  if (!data.name || !data.email || !data.role) {
    throw new Error("Missing required fields: name, email, and role are required");
  }

  // Validate role is one of the allowed values
  const validRoles: Role[] = ['admin', 'staff', 'parent'];
  if (!validRoles.includes(data.role)) {
    throw new Error(`Invalid role: ${data.role}. Must be one of: ${validRoles.join(', ')}`);
  }

  try {
    const userDocRef = doc(db, "users", uid);
    
    await setDoc(userDocRef, {
      uid,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      role: data.role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ User document created for ${uid} with role: ${data.role}`);
  } catch (error) {
    console.error("❌ Error creating user document:", error);
    throw error;
  }
}

/**
 * Fetches a user document from Firestore
 * 
 * @param uid - The user's Firebase Auth UID
 * @returns Promise<User | null> - The user data or null if not found
 */
export async function getUserDoc(uid: string): Promise<User | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.warn(`User document not found for uid: ${uid}`);
      return null;
    }

    return userDoc.data() as User;
  } catch (error) {
    console.error("Error fetching user document:", error);
    throw error;
  }
}

/**
 * Updates a user document in Firestore
 * 
 * @param uid - The user's Firebase Auth UID
 * @param updates - Partial user data to update
 * @returns Promise<void>
 */
export async function updateUserDoc(
  uid: string,
  updates: Partial<Omit<User, 'uid' | 'createdAt'>>
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", uid);
    
    await setDoc(
      userDocRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✅ User document updated for ${uid}`);
  } catch (error) {
    console.error("❌ Error updating user document:", error);
    throw error;
  }
}
