import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

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
