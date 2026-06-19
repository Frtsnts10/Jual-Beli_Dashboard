import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const STORE_ID = "4lHojACGdUrNKQDhocrt";

async function wipe() {
  console.log(`Starting wipe for store ${STORE_ID}...`);
  
  const collections = ['inventory', 'orders', 'customers', 'digital_accounts'];
  
  for (const col of collections) {
    const snap = await db.collection(col).where("store_id", "==", STORE_ID).get();
    if (snap.empty) {
      console.log(`No documents found in ${col}.`);
      continue;
    }
    
    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Deleted ${snap.size} documents from ${col}.`);
  }
  
  console.log('Wipe complete.');
  process.exit(0);
}

wipe().catch(console.error);
