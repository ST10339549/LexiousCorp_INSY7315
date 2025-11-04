import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface MenuItem {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  name: string;
  price: number;
  allergens?: string[];
}

export interface Menu {
  id: string;
  weekOf: string; // YYYY-MM-DD (Monday)
  items: MenuItem[];
  createdAt: Date;
}

export interface OrderSelection {
  day: string;
  itemId: string;
  qty: number;
}

export interface Order {
  id: string;
  userId: string;
  childId: string;
  weekOf: string; // YYYY-MM-DD (Monday)
  selections: OrderSelection[];
  total: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Date;
}

/**
 * Create a new weekly menu
 */
export async function createMenu(
  weekOf: string,
  items: Omit<MenuItem, 'id'>[]
): Promise<string> {
  try {
    const itemsWithIds = items.map((item, index) => ({
      ...item,
      id: `item_${Date.now()}_${index}`,
    }));

    const menuData = {
      weekOf,
      items: itemsWithIds,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'menus'), menuData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating menu:', error);
    throw error;
  }
}

/**
 * Update an existing menu
 */
export async function updateMenu(
  menuId: string,
  items: Omit<MenuItem, 'id'>[]
): Promise<void> {
  try {
    const itemsWithIds = items.map((item, index) => ({
      ...item,
      id: `item_${Date.now()}_${index}`,
    }));

    const menuRef = doc(db, 'menus', menuId);
    await updateDoc(menuRef, {
      items: itemsWithIds,
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    throw error;
  }
}

/**
 * Get the active menu for a specific week
 */
export async function getActiveMenuForWeek(weekOf: string): Promise<Menu | null> {
  try {
    const q = query(
      collection(db, 'menus'),
      where('weekOf', '==', weekOf)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      weekOf: data.weekOf,
      items: data.items || [],
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting menu for week:', error);
    throw error;
  }
}

/**
 * Get all menus
 */
export async function getAllMenus(): Promise<Menu[]> {
  try {
    const q = query(
      collection(db, 'menus'),
      orderBy('weekOf', 'desc')
    );

    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        weekOf: data.weekOf,
        items: data.items || [],
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });
  } catch (error) {
    console.error('Error getting all menus:', error);
    throw error;
  }
}

/**
 * Place a lunch order
 */
export async function placeOrder(
  userId: string,
  childId: string,
  weekOf: string,
  selections: OrderSelection[],
  total: number
): Promise<string> {
  try {
    const orderData = {
      userId,
      childId,
      weekOf,
      selections,
      total,
      status: 'pending' as const,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
}

/**
 * List orders by parent (userId)
 */
export async function listOrdersByParent(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    
    const orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        childId: data.childId,
        weekOf: data.weekOf,
        selections: data.selections || [],
        total: data.total || 0,
        status: data.status || 'pending',
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });

    // Sort by createdAt descending in memory
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return orders;
  } catch (error) {
    console.error('Error listing orders by parent:', error);
    throw error;
  }
}

/**
 * List all orders (admin)
 */
export async function listOrdersByAdmin(
  weekOf?: string,
  status?: 'pending' | 'paid' | 'cancelled'
): Promise<Order[]> {
  try {
    // Fetch all orders without complex filtering to avoid index requirements
    const q = query(collection(db, 'orders'));
    const snapshot = await getDocs(q);
    
    let orders = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        childId: data.childId,
        weekOf: data.weekOf,
        selections: data.selections || [],
        total: data.total || 0,
        status: data.status || 'pending',
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });

    // Filter in memory
    if (weekOf) {
      orders = orders.filter(order => order.weekOf === weekOf);
    }
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Sort by createdAt descending
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return orders;
  } catch (error) {
    console.error('Error listing orders by admin:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'paid' | 'cancelled'
): Promise<void> {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, { status });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Get the Monday of the current week in YYYY-MM-DD format
 */
export function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get the Monday of a given date in YYYY-MM-DD format
 */
export function getMondayOfWeek(date: Date): string {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

/**
 * Format date to readable week string
 */
export function formatWeekString(weekOf: string): string {
  const monday = new Date(weekOf);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${monday.toLocaleDateString('en-US', options)} - ${sunday.toLocaleDateString('en-US', options)}`;
}
