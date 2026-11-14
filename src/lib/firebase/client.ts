import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Public client config — safe to embed. The client SDK is only used for Firebase
// Auth; all Firestore access goes through the Admin SDK on the server.
const firebaseConfig = {
  apiKey: "AIzaSyAFDaggQZQNTG850wYancu2H9WB0VYQ0fY",
  authDomain: "web-store-4cf23.firebaseapp.com",
  projectId: "web-store-4cf23",
  storageBucket: "web-store-4cf23.firebasestorage.app",
  messagingSenderId: "551756253728",
  appId: "1:551756253728:web:c57962a3ddf26028da0a45",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
