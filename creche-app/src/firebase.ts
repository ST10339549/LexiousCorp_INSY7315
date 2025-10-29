// creche-app/firebaseConfig.ts
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// IMPORTANT: we'll import messaging in a try/catch because FCM
// can explode in certain environments (like Expo Go native runtime)
import type { Messaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyD9ZsY2_aGDRDyqpCM38vnLdpG2MYwuF_Y",
    authDomain: "creche-app-eb187.firebaseapp.com",
    projectId: "creche-app-eb187",
    storageBucket: "creche-app-eb187.firebasestorage.app",
    messagingSenderId: "1048010134843",
    appId: "1:1048010134843:web:c47d49aa0fabe2c887931e",
    measurementId: "G-4GW74LPS94"
};

const app: FirebaseApp =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Try to init messaging, but don't crash if unsupported here
let messaging: Messaging | null = null;
try {
    const { getMessaging } = require("firebase/messaging");
    messaging = getMessaging(app);
} catch (e) {
    messaging = null;
}

export { messaging };
export default app;
