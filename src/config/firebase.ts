import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCXhS5QaAaStX9gRklbYykgfsiOB_KBNms",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "banhang-e5939.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "banhang-e5939",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "banhang-e5939.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "112986605892",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:112986605892:web:403be0cf5e88371b15ef11",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-376WKQMF9C"
};

// Initialize Firebase once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Initialize analytics safely
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}
