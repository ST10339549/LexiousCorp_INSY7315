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
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { listOrdersByParent } from './lunch';
import { getPendingFeesByUser, updateFeeStatus } from './fees';
import { STRIPE_CONFIG } from '../config/stripe';

/**
 * Fee item structure representing a payment item
 */
export interface FeeItem {
  id: string;
  description: string;
  amountZAR: number;
  type: 'tuition' | 'lunch' | 'registration' | 'activity' | 'late_fee' | 'other';
  relatedId?: string; // orderId for lunch orders, feeId for other fees
}

/**
 * Receipt structure for completed payments
 */
export interface Receipt {
  id: string;
  userId: string;
  orderIds: string[];
  amount: number;
  txnId: string;
  createdAt: Date;
  paymentMethod?: string;
  status: 'success' | 'failed' | 'pending';
}

/**
 * Payment intent response (mock Stripe structure)
 */
export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'succeeded' | 'processing' | 'requires_confirmation';
  id: string;
}

/**
 * Fetch outstanding fees for a user
 * Returns tuition fees and pending lunch orders
 * 
 * @param userId - The user's Firebase UID
 * @returns Promise<FeeItem[]> - Array of outstanding fee items
 */
export async function fetchFees(userId: string): Promise<FeeItem[]> {
  try {
    const items: FeeItem[] = [];

    // Fetch pending lunch orders
    const orders = await listOrdersByParent(userId);
    const pendingOrders = orders.filter(order => order.status === 'pending');

    pendingOrders.forEach(order => {
      items.push({
        id: `lunch_${order.id}`,
        description: `Lunch Order - Week of ${formatWeekDate(order.weekOf)} (${order.selections.length} items)`,
        amountZAR: order.total,
        type: 'lunch',
        relatedId: order.id,
      });
    });

    // Fetch all pending fees (tuition, activity fees, etc.)
    const pendingFees = await getPendingFeesByUser(userId);
    pendingFees.forEach(fee => {
      items.push({
        id: `fee_${fee.id}`,
        description: fee.description,
        amountZAR: fee.amount,
        type: fee.type,
        relatedId: fee.id,
      });
    });

    return items;
  } catch (error) {
    console.error('Error fetching fees:', error);
    throw error;
  }
}

/**
 * 
 * @param totalZAR - Total amount in South African Rand
 * @returns Promise<PaymentIntent> - Payment intent with client secret
 */

export async function createPaymentIntent(totalZAR: number): Promise<PaymentIntent> {
  try {
    console.log('[Payments] Creating payment intent for R', totalZAR);
    
    // TODO: Replace with backend API call in production
    // Example production code:
    // const response = await fetch('https://your-backend.com/create-payment-intent', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount: Math.round(totalZAR * 100), currency: 'zar' })
    // });
    // return await response.json();
    
    // Mock delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock payment intent for Stripe test mode
    // This works with Stripe's CardField and test cards
    const mockIntent: PaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      amount: Math.round(totalZAR * 100), // Convert to cents
      currency: 'zar',
      status: 'requires_payment_method',
    };

    console.log('[Payments] Created mock payment intent:', mockIntent.id);
    console.log('[Payments] ⚠️  Using TEST MODE - Card details are validated by Stripe SDK');
    return mockIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

/**
 * Process a payment (mock)
 * Simulates payment confirmation and updates order statuses
 * 
 * @param userId - The user's Firebase UID
 * @param orderIds - Array of order IDs being paid
 * @param amount - Total payment amount in ZAR
 * @param paymentIntentId - The payment intent ID
 * @returns Promise<string> - Receipt ID
 */
export async function processPayment(
  userId: string,
  orderIds: string[],
  amount: number,
  paymentIntentId: string
): Promise<string> {
  try {
    const batch = writeBatch(db);

    // Process each payment item
    for (const itemId of orderIds) {
      // Handle lunch orders
      if (itemId.startsWith('lunch_')) {
        const orderId = itemId.replace('lunch_', '');
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, { status: 'paid' });
      }
      // Handle fee items
      else if (itemId.startsWith('fee_')) {
        const feeId = itemId.replace('fee_', '');
        // Update fee status to 'paid' using the fees service
        await updateFeeStatus(feeId, 'paid');
      }
    }

    // Create receipt document
    const receiptData = {
      userId,
      orderIds,
      amount,
      txnId: paymentIntentId,
      paymentMethod: 'card', // mock
      status: 'success' as const,
      createdAt: serverTimestamp(),
    };

    const receiptRef = await addDoc(collection(db, 'receipts'), receiptData);

    // Commit batch updates (for lunch orders only, fees are already updated)
    await batch.commit();

    console.log('[Payments] Payment processed successfully, receipt:', receiptRef.id);
    return receiptRef.id;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

/**
 * Mock payment confirmation
 * Simulates successful payment
 * 
 * @param paymentIntentId - The payment intent ID
 * @returns Promise<boolean> - Success status
 */
export async function confirmPayment(paymentIntentId: string): Promise<boolean> {
  try {
    // Mock delay to simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock: Always return success for demo purposes
    console.log('[Payments] Mock payment confirmed:', paymentIntentId);
    return true;
  } catch (error) {
    console.error('Error confirming payment:', error);
    return false;
  }
}

/**
 * List receipts for a user
 * 
 * @param userId - The user's Firebase UID
 * @returns Promise<Receipt[]> - Array of receipts
 */
export async function listReceipts(userId: string): Promise<Receipt[]> {
  try {
    // Query without orderBy to avoid index requirement
    const q = query(
      collection(db, 'receipts'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    
    const receipts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        orderIds: data.orderIds || [],
        amount: data.amount || 0,
        txnId: data.txnId || '',
        paymentMethod: data.paymentMethod,
        status: data.status || 'success',
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });

    // Sort in memory by createdAt descending
    receipts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return receipts;
  } catch (error) {
    console.error('Error listing receipts:', error);
    throw error;
  }
}

/**
 * Get a single receipt by ID
 * 
 * @param receiptId - The receipt document ID
 * @returns Promise<Receipt | null> - Receipt or null if not found
 */
export async function getReceipt(receiptId: string): Promise<Receipt | null> {
  try {
    const docRef = doc(db, 'receipts', receiptId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      orderIds: data.orderIds || [],
      amount: data.amount || 0,
      txnId: data.txnId || '',
      paymentMethod: data.paymentMethod,
      status: data.status || 'success',
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error('Error getting receipt:', error);
    throw error;
  }
}

/**
 * Format week date for display
 */
function formatWeekDate(weekOf: string): string {
  const date = new Date(weekOf);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
