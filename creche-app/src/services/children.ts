import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../firebase";
import { childDocId, normalizeName } from "../utils/childKey";

/**
 * Child data structure
 */
export type Child = {
  id: string;
  parentId: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  allergies: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Input for creating a new child
 */
export type CreateChildInput = {
  parentId: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD format
  allergies?: string[];
};

/**
 * Uses a transaction with deterministic doc ID to prevent duplicates
 * 
 * @param input - Child data
 * @returns The document ID of the created child
 * @throws Error if child with same (parentId, normalized name, DOB) already exists
 */
export async function addChildUnique(input: CreateChildInput): Promise<string> {
  const { parentId, name, dateOfBirth, allergies = [] } = input;

  // Generate deterministic doc ID
  const docId = childDocId(parentId, name, dateOfBirth);
  const childRef = doc(db, "children", docId);

  try {
    // Use transaction to guarantee atomicity
    await runTransaction(db, async (transaction) => {
      const childDoc = await transaction.get(childRef);

      if (childDoc.exists()) {
        throw new Error(
          "A child with this name and date of birth already exists for this parent."
        );
      }

      // Create the child document
      transaction.set(childRef, {
        parentId,
        name: name.trim(),
        dateOfBirth,
        allergies,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    console.log(`Child created successfully with ID: ${docId}`);
    return docId;
  } catch (error) {
    console.error("Error adding child:", error);
    throw error;
  }
}

/**
 * Check if a child already exists (for pre-validation)
 * 
 * @param parentId - Parent's UID
 * @param name - Child's name
 * @param dateOfBirth - Child's DOB (YYYY-MM-DD)
 * @returns true if child exists, false otherwise
 */
export async function checkChildExists(
  parentId: string,
  name: string,
  dateOfBirth: string
): Promise<boolean> {
  try {
    const docId = childDocId(parentId, name, dateOfBirth);
    const childRef = doc(db, "children", docId);
    const childDoc = await getDoc(childRef);
    return childDoc.exists();
  } catch (error) {
    console.error("Error checking child existence:", error);
    return false;
  }
}

/**
 * Listen to children for a specific parent (real-time updates)
 * 
 * @param parentId - Parent's UID
 * @param callback - Function called with updated children array
 * @returns Unsubscribe function
 */
export function listenChildrenByParent(
  parentId: string,
  callback: (children: Child[]) => void
): Unsubscribe {
  const childrenRef = collection(db, "children");
  const q = query(
    childrenRef,
    where("parentId", "==", parentId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const children: Child[] = [];
      snapshot.forEach((doc) => {
        children.push({
          id: doc.id,
          ...doc.data(),
        } as Child);
      });
      
      // Sort client-side by name
      children.sort((a, b) => a.name.localeCompare(b.name));
      
      console.log(`[listenChildrenByParent] Found ${children.length} children for parent ${parentId}`);
      callback(children);
    },
    (error) => {
      console.error("Error listening to children:", error);
      callback([]);
    }
  );
}

/**
 * Fetch children for a specific parent (one-time fetch)
 * 
 * @param parentId - Parent's UID
 * @returns Array of children
 */
export async function fetchChildrenOnce(parentId: string): Promise<Child[]> {
  try {
    const childrenRef = collection(db, "children");
    const q = query(
      childrenRef,
      where("parentId", "==", parentId)
    );

    const snapshot = await getDocs(q);
    const children: Child[] = [];

    snapshot.forEach((doc) => {
      children.push({
        id: doc.id,
        ...doc.data(),
      } as Child);
    });

    // Sort client-side by name
    children.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`[fetchChildrenOnce] Found ${children.length} children for parent ${parentId}`);
    return children;
  } catch (error) {
    console.error("Error fetching children:", error);
    return [];
  }
}

/**
 * Fetch all children (admin only)
 * 
 * @returns Array of all children
 */
export async function fetchAllChildren(): Promise<Child[]> {
  try {
    const childrenRef = collection(db, "children");
    const snapshot = await getDocs(childrenRef);
    const children: Child[] = [];

    snapshot.forEach((doc) => {
      children.push({
        id: doc.id,
        ...doc.data(),
      } as Child);
    });

    // Sort client-side by name
    children.sort((a, b) => a.name.localeCompare(b.name));

    return children;
  } catch (error) {
    console.error("Error fetching all children:", error);
    return [];
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use addChildUnique instead
 */
export async function addChild(
  parentId: string,
  name: string,
  dateOfBirth: string,
  allergies: string[] = []
): Promise<string> {
  return addChildUnique({ parentId, name, dateOfBirth, allergies });
}
