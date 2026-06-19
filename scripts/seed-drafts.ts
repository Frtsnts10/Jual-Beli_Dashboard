import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';

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

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function run() {
  const batch = db.batch();

  console.log('Creating pending draft requests for Approvals Desk...');

  // Draft 1: Create new inventory item
  const d1 = db.collection('draft_requests').doc();
  batch.set(d1, {
    id: d1.id,
    store_id: STORE_ID,
    type: 'CREATE',
    target_collection: 'inventory',
    target_id: null,
    payload: {
      name: 'Spotify Premium Family',
      description: 'Shared Spotify Family Plan for 6 accounts',
      price: 45000,
      stock: 6,
      status: 'active'
    },
    status: 'PENDING',
    proposed_by: {
      uid: 'staff-123',
      name: 'Jane Staff',
      email: 'jane.staff@example.com'
    },
    created_at: daysAgo(1),
  });

  // Draft 2: Update existing customer
  const d2 = db.collection('draft_requests').doc();
  batch.set(d2, {
    id: d2.id,
    store_id: STORE_ID,
    type: 'UPDATE',
    target_collection: 'customers',
    target_id: 'sim-cust-001',
    payload: {
      phone: '+62 812-9999-8888',
      notes: 'Customer changed phone number'
    },
    status: 'PENDING',
    proposed_by: {
      uid: 'staff-456',
      name: 'John Agent',
      email: 'john.agent@example.com'
    },
    created_at: daysAgo(0),
  });

  // Draft 3: Delete old product
  const d3 = db.collection('draft_requests').doc();
  batch.set(d3, {
    id: d3.id,
    store_id: STORE_ID,
    type: 'DELETE',
    target_collection: 'inventory',
    target_id: 'old-product-xyz',
    payload: {
      name: 'Expired Promo Package'
    },
    status: 'PENDING',
    proposed_by: {
      uid: 'staff-123',
      name: 'Jane Staff',
      email: 'jane.staff@example.com'
    },
    created_at: daysAgo(2),
  });

  await batch.commit();
  console.log('✅ Injected 3 draft requests successfully!');
  process.exit(0);
}

run().catch(console.error);
