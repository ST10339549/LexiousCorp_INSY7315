
/**
 * User role type definition
 * Supports three roles: admin, staff, and parent
 */
export type Role = 'admin' | 'staff' | 'parent';

/**
 * User data structure
 */
export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
  pushToken?: string;
}
