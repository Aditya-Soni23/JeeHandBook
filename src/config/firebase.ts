import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCzuu8o7HnHrQ0T3YdJ1b0dBg6l9T5fbfQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "lite-2ec2a.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://lite-2ec2a-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "lite-2ec2a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "lite-2ec2a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "453998451075",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:453998451075:web:083caaa461b0970719feb6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VCDRPLKBWK"
};

// Initialize or retrieve app
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const database = getDatabase(app);
export const storage = getStorage(app);

// Safe Analytics initialization in browser
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Analytics initialization failed silently:", e);
      }
    }
  });
}
