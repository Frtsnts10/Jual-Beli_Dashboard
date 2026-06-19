import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

async function purgeCollection(collectionName) {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();
  
  if (snapshot.empty) {
    console.log(`[INFO] Collection '${collectionName}' is already empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`[SUCCESS] Purged ${snapshot.size} documents from '${collectionName}'.`);
}

async function run() {
  console.log("Starting purge process...");
  await purgeCollection("inventory"); // 'products'
  await purgeCollection("customers");
  await purgeCollection("orders");
  console.log("Purge complete!");
  process.exit(0);
}

run().catch(console.error);
