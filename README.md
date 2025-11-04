# Creche Connect

A comprehensive mobile application for managing creche (daycare) operations, built with React Native and Expo. This application facilitates communication and management between parents, staff, and administrators.

## 📱 Features

### For Parents
- **Child Management**: Add and manage children's profiles
- **Attendance Tracking**: View child attendance records
- **Lunch Ordering**: Order meals for children
- **Events Calendar**: Stay updated with creche events
- **Announcements**: Receive important notifications
- **Payments**: Make fee payments and view receipts
- **Push Notifications**: Get real-time updates

### For Staff
- **Class Management**: Manage assigned classes and children
- **Attendance Recording**: Mark daily attendance
- **Announcements**: Create and view announcements
- **Event Management**: View and manage events
- **Lunch Orders**: View and manage lunch orders for their class

### For Administrators
- **User Management**: Manage parents and staff accounts
- **Child Assignment**: Assign children to staff members
- **Fee Management**: Set and manage fees
- **Menu Management**: Create and update lunch menus
- **Event Management**: Create and manage events
- **Order Management**: Oversee all lunch orders
- **Analytics**: View comprehensive dashboard statistics

## 🛠️ Technology Stack

- **Frontend**: React Native with Expo
- **UI Framework**: NativeBase
- **Backend**: Firebase (Firestore, Authentication)
- **Payment Processing**: Stripe
- **Push Notifications**: Expo Notifications
- **State Management**: React Hooks
- **Form Handling**: React Hook Form with Zod validation
- **Language**: TypeScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ST10339549/LexiousCorp_INSY7315.git
cd LexiousCorp_INSY7315
```

### 2. Install Dependencies

```bash
cd creche-app
npm install
```

### 3. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database and Authentication
3. Create a `firebase-config.ts` file in `creche-app/src/` with your Firebase credentials:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

4. Deploy Firestore rules and indexes:

```bash
# From the root directory
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 4. Stripe Configuration

1. Create a Stripe account at [Stripe](https://stripe.com/)
2. Update the Stripe configuration in `creche-app/src/config/stripe.ts` with your publishable key

### 5. Run the Application

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web
```

## 🔒 User Roles & Authentication

The application supports three user roles:

1. **Parent**: Can manage their children, view announcements, order lunches, and make payments
2. **Staff**: Can manage assigned classes, record attendance, and create announcements
3. **Admin**: Has full access to all management features

## 🗄️ Database Structure

The application uses Firebase Firestore with the following main collections:

- `users` - User profiles and authentication data
- `children` - Children information
- `assignments` - Staff-to-children assignments
- `attendance` - Daily attendance records
- `announcements` - System announcements
- `events` - Calendar events
- `fees` - Fee structures
- `menu` - Lunch menu items
- `orders` - Lunch orders
- `payments` - Payment records

## 📱 Push Notifications

The app uses Expo Notifications for push notifications. Features include:

- Real-time announcement notifications
- Event reminders
- Payment confirmations
- Attendance alerts

## 💳 Payment Integration

Stripe integration allows:
- Secure payment processing
- Fee payments
- Receipt generation
- Payment history tracking

## 🤝 Contributing

This project was developed by LexiousCorp for INSY7315.

### Development Team
- Melissa Pillay (ST10339549)
- Jared Pillay (ST10339829)
