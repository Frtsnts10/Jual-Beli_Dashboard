import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize auth and db safely, accounting for SSR/SSG build environments
// where environment variables might not be populated yet.
let auth: ReturnType<typeof getAuth>;
let db: ReturnType<typeof getFirestore>;

try {
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase Auth initialization failed (likely during build):", error);
  auth = {} as ReturnType<typeof getAuth>;
}

try {
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase Firestore initialization failed (likely during build):", error);
  db = {} as ReturnType<typeof getFirestore>;
}

export { app, auth, db };
