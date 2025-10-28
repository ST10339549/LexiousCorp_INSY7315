
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Messaging: FCM web-style. We may configure later for notifications.
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

// These are *client*-side keys. They are allowed to be public.
// Do NOT put secrets like service account keys here.
const firebaseConfig = {
    apiKey: "AIzaSyD9ZsY2_aGDRDyqpCM38vnLdpG2MYwuF_Y",
    authDomain: "creche-app-eb187.firebaseapp.com",
    projectId: "creche-app-eb187",
    storageBucket: "creche-app-eb187.firebasestorage.app",
    messagingSenderId: "1048010134843",
    appId: "1:1048010134843:web:c47d49aa0fabe2c887931e",
    measurementId: "G-4GW74LPS94"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// Messaging
let messaging: ReturnType<typeof getMessaging> | null = null;
(async () => {
    if (await isMessagingSupported()) {
        messaging = getMessaging(app);
    }
})();

export { app, auth, db, storage, messaging };
