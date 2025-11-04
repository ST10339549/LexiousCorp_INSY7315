import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Fee structure for tuition and other charges
 */
export interface Fee {
  id: string;
  userId: string;
  childId?: string;
  childName?: string;
  description: string;
  amount: number; // in ZAR
  type: 'tuition' | 'registration' | 'activity' | 'late_fee' | 'other';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  paidAt?: Date;
  receiptId?: string;
  createdBy: string; // Admin user ID who created the fee
  notes?: string;
}

/**
 * Fee template for admins to create recurring fees
 */
export interface FeeTemplate {
  id: string;
  name: string;
  description: string;
  amount: number;
  type: 'tuition' | 'registration' | 'activity' | 'late_fee' | 'other';
  recurring: 'monthly' | 'weekly' | 'once' | 'annual';
  active: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * Create a new fee for a user
 */
export async function createFee(
  feeData: Omit<Fee, 'id' | 'createdAt'>
): Promise<string> {
  try {
    // Remove undefined fields to avoid Firestore errors
    const cleanData: any = { ...feeData };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    const docRef = await addDoc(collection(db, 'fees'), {
      ...cleanData,
      createdAt: serverTimestamp(),
    });
    console.log('[Fees] Created fee:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Fees] Error creating fee:', error);
    throw error;
  }
}

/**
 * Create a fee template
 */
export async function createFeeTemplate(
  templateData: Omit<FeeTemplate, 'id' | 'createdAt'>
): Promise<string> {
  try {
    // Remove undefined fields to avoid Firestore errors
    const cleanData: any = { ...templateData };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });

    const docRef = await addDoc(collection(db, 'feeTemplates'), {
      ...cleanData,
      createdAt: serverTimestamp(),
    });
    console.log('[Fees] Created fee template:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Fees] Error creating fee template:', error);
    throw error;
  }
}

/**
 * Get all fee templates
 */
export async function getAllFeeTemplates(): Promise<FeeTemplate[]> {
  try {
    const q = query(
      collection(db, 'feeTemplates'),
      where('active', '==', true)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        amount: data.amount,
        type: data.type,
        recurring: data.recurring,
        active: data.active,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('[Fees] Error getting fee templates:', error);
    throw error;
  }
}

/**
 * Get pending fees for a user
 */
export async function getPendingFeesByUser(userId: string): Promise<Fee[]> {
  try {
    const q = query(
      collection(db, 'fees'),
      where('userId', '==', userId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        childId: data.childId,
        childName: data.childName,
        description: data.description,
        amount: data.amount,
        type: data.type,
        status: data.status,
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        paidAt: data.paidAt?.toDate(),
        receiptId: data.receiptId,
        createdBy: data.createdBy,
        notes: data.notes,
      };
    });
  } catch (error) {
    console.error('[Fees] Error getting pending fees:', error);
    throw error;
  }
}

/**
 * Get all fees (admin view)
 */
export async function getAllFees(status?: 'pending' | 'paid' | 'overdue' | 'cancelled'): Promise<Fee[]> {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, 'fees'),
        where('status', '==', status)
      );
    } else {
      q = query(collection(db, 'fees'));
    }

    const snapshot = await getDocs(q);
    
    const fees = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        childId: data.childId,
        childName: data.childName,
        description: data.description,
        amount: data.amount,
        type: data.type,
        status: data.status,
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        paidAt: data.paidAt?.toDate(),
        receiptId: data.receiptId,
        createdBy: data.createdBy,
        notes: data.notes,
      };
    });

    // Sort by due date descending
    fees.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

    return fees;
  } catch (error) {
    console.error('[Fees] Error getting all fees:', error);
    throw error;
  }
}

/**
 * Update fee status (e.g., mark as paid)
 */
export async function updateFeeStatus(
  feeId: string,
  status: 'pending' | 'paid' | 'overdue' | 'cancelled',
  receiptId?: string
): Promise<void> {
  try {
    const feeRef = doc(db, 'fees', feeId);
    const updateData: any = { status };
    
    if (status === 'paid') {
      updateData.paidAt = serverTimestamp();
      if (receiptId) {
        updateData.receiptId = receiptId;
      }
    }

    await updateDoc(feeRef, updateData);
    console.log('[Fees] Updated fee status:', feeId, status);
  } catch (error) {
    console.error('[Fees] Error updating fee status:', error);
    throw error;
  }
}

/**
 * Update fee details
 */
export async function updateFee(
  feeId: string,
  updates: Partial<Omit<Fee, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  try {
    // Remove undefined fields to avoid Firestore errors
    const cleanUpdates: any = { ...updates };
    Object.keys(cleanUpdates).forEach(key => {
      if (cleanUpdates[key] === undefined) {
        delete cleanUpdates[key];
      }
    });

    const feeRef = doc(db, 'fees', feeId);
    await updateDoc(feeRef, cleanUpdates);
    console.log('[Fees] Updated fee:', feeId);
  } catch (error) {
    console.error('[Fees] Error updating fee:', error);
    throw error;
  }
}

/**
 * Delete a fee
 */
export async function deleteFee(feeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'fees', feeId));
    console.log('[Fees] Deleted fee:', feeId);
  } catch (error) {
    console.error('[Fees] Error deleting fee:', error);
    throw error;
  }
}

/**
 * Assign fee to a parent based on template
 */
export async function assignFeeFromTemplate(
  templateId: string,
  userId: string,
  childId: string,
  childName: string,
  dueDate: Date,
  adminId: string,
  notes?: string
): Promise<string> {
  try {
    // Get template
    const templateRef = doc(db, 'feeTemplates', templateId);
    const templateSnap = await getDoc(templateRef);

    if (!templateSnap.exists()) {
      throw new Error('Fee template not found');
    }

    const template = templateSnap.data();

    // Create fee from template - only include notes if it's provided
    const feeData: any = {
      userId,
      childId,
      childName,
      description: template.description,
      amount: template.amount,
      type: template.type,
      status: 'pending',
      dueDate,
      createdBy: adminId,
    };

    // Only add notes if it's provided and not undefined
    if (notes !== undefined && notes !== null && notes !== '') {
      feeData.notes = notes;
    }

    return await createFee(feeData);
  } catch (error) {
    console.error('[Fees] Error assigning fee from template:', error);
    throw error;
  }
}

/**
 * Get fees by child
 */
export async function getFeesByChild(childId: string): Promise<Fee[]> {
  try {
    const q = query(
      collection(db, 'fees'),
      where('childId', '==', childId)
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        childId: data.childId,
        childName: data.childName,
        description: data.description,
        amount: data.amount,
        type: data.type,
        status: data.status,
        dueDate: data.dueDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        paidAt: data.paidAt?.toDate(),
        receiptId: data.receiptId,
        createdBy: data.createdBy,
        notes: data.notes,
      };
    });
  } catch (error) {
    console.error('[Fees] Error getting fees by child:', error);
    throw error;
  }
}

/**
 * Get user details (name and email) for fee assignment
 */
export async function getUsersForFeeAssignment(): Promise<Array<{ id: string; name: string; email: string; role: string }>> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'parent')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: data.role,
      };
    });
  } catch (error) {
    console.error('[Fees] Error getting users:', error);
    throw error;
  }
}
