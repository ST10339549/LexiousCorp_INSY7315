/**
 * Stripe Configuration
 * 
 * These are TEST MODE credentials for demonstration purposes.
 * In production, environment variables will be used and keys kept secure.
 */

export const STRIPE_CONFIG = {
  // Stripe Publishable Key (Test Mode) - Safe to expose in client code
  publishableKey: 'pk_test_51QJRBSKkNl4rF7dZ8xKqGBiR3eO1J5bB7nBcQiJl2PzmJEvIY3L7fYcD7AaHsJ3jYbEjzGLyQvGMZwq1p2m0YX3H00UVPbIwOz',
  
  // Merchant display name
  merchantDisplayName: 'Little Lexious Creche',
  
  // Currency
  currency: 'zar',
  
  // Test mode indicator
  isTestMode: true,
};

/**
 * Test Card Numbers for Stripe
 * Use these during testing
 */
export const TEST_CARDS = {
  SUCCESS: {
    number: '4242424242424242',
    expMonth: 12,
    expYear: 2034,
    cvc: '123',
    description: 'Successful payment',
  },
  DECLINED: {
    number: '4000000000000002',
    expMonth: 12,
    expYear: 2034,
    cvc: '123',
    description: 'Payment declined',
  },
  REQUIRES_AUTH: {
    number: '4000002500003155',
    expMonth: 12,
    expYear: 2034,
    cvc: '123',
    description: 'Requires 3D Secure authentication',
  },
  INSUFFICIENT_FUNDS: {
    number: '4000000000009995',
    expMonth: 12,
    expYear: 2034,
    cvc: '123',
    description: 'Insufficient funds',
  },
};
