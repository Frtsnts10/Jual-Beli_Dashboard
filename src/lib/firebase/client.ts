import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// Public client config for the "web-store-dashboard" Firebase project — safe to embed.
// The client SDK is only used for Firebase Auth; all Firestore access goes through the
// Admin SDK on the server.
const firebaseConfig = {
  apiKey: "AIzaSyDYlTzu5G2qS7OzBmZSIqybLW30cOwpfJ8",
  authDomain: "web-store-dashboard.firebaseapp.com",
  projectId: "web-store-dashboard",
  storageBucket: "web-store-dashboard.firebasestorage.app",
  messagingSenderId: "658565631786",
  appId: "1:658565631786:web:24e3113ac2f177cc875853",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Local testing against the Auth emulator.
const emulator = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
if (emulator && !(auth as unknown as { emulatorConfig?: unknown }).emulatorConfig) {
  connectAuthEmulator(auth, `http://${emulator}`, { disableWarnings: true });
}
