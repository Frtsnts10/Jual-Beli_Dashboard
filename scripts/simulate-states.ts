import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const STORE_ID = "4lHojACGdUrNKQDhocrt";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

async function run() {
  const batch = db.batch();

  // ── 1. UPGRADE STORE TO LIFETIME PRO ────────────────────────────────────────
  console.log('1. Upgrading store to Lifetime Pro...');
  const storeRef = db.collection('stores').doc(STORE_ID);
  batch.update(storeRef, {
    plan: 'Shop Dashboard Pro (Lifetime)',
    plan_activated_at: new Date().toISOString(),
    plan_expires_at: null, // lifetime = no expiry
  });

  // ── 2. EXPIRED INVENTORY ACCOUNTS ───────────────────────────────────────────
  console.log('2. Marking inventory accounts as expired...');
  const invSnap = await db.collection('inventory').where('store_id', '==', STORE_ID).get();
  const invDocs = invSnap.docs;

  // Mark the first 2 inventory items as expired (past date)
  if (invDocs.length >= 2) {
    batch.update(invDocs[0].ref, {
      date_expired: daysAgo(7),
      status: 'expired',
    });
    batch.update(invDocs[1].ref, {
      date_expired: daysAgo(3),
      status: 'expired',
    });
    // Mark one as expiring soon (within 3 days)
    if (invDocs.length >= 3) {
      batch.update(invDocs[2].ref, {
        date_expired: daysFromNow(2),
        status: 'active',
      });
    }
    console.log(`  Expired: ${invDocs[0].id}, ${invDocs[1].id}`);
    console.log(`  Expiring soon: ${invDocs[2]?.id}`);
  }

  // ── 3. BANNED CUSTOMERS ──────────────────────────────────────────────────────
  console.log('3. Simulating banned customers...');
  const custSnap = await db.collection('customers').where('store_id', '==', STORE_ID).limit(3).get();
  if (custSnap.docs.length >= 2) {
    const bannedCust1 = custSnap.docs[0];
    const bannedCust2 = custSnap.docs[1];
    batch.update(bannedCust1.ref, {
      status: 'banned',
      ban_reason: 'Account sharing detected — multiple simultaneous streams from different geolocations.',
      banned_at: daysAgo(5),
    });
    batch.update(bannedCust2.ref, {
      status: 'banned',
      ban_reason: 'Credential resale suspected — password distribution via third-party channels.',
      banned_at: daysAgo(2),
    });
    console.log(`  Banned: ${bannedCust1.id}, ${bannedCust2.id}`);
  }

  // ── 4. COMPLAINTS DESK TICKETS ───────────────────────────────────────────────
  console.log('4. Creating complaint desk tickets...');

  // Ticket 1: Just In (open)
  const c1 = db.collection('complaints').doc();
  batch.set(c1, {
    id: c1.id,
    store_id: STORE_ID,
    customer_name: 'Customer 3974',
    customer_phone: '0838-9840-3974',
    title: 'Cannot access Netflix account — profile slot unavailable',
    description: 'Customer reports that after payment, the assigned profile slot shows "Profile Unavailable" and they are unable to stream. Confirmed payment on WhatsApp receipt. Needs immediate slot reassignment.',
    status: 'pending',
    priority: 'high',
    satisfaction_outcome: null,
    refund_amount: null,
    refund_status: 'none',
    created_at: daysAgo(0),
  });

  // Ticket 2: On-going Investigation
  const c2 = db.collection('complaints').doc();
  batch.set(c2, {
    id: c2.id,
    store_id: STORE_ID,
    customer_name: 'Customer 3555',
    customer_phone: '0819-1709-3555',
    title: 'Password changed without notice — account locked',
    description: 'Customer claims the Netflix password was changed by another user in the shared group, locking them out. Investigation underway to determine if account was compromised or if another member changed it.',
    status: 'investigating',
    priority: 'high',
    satisfaction_outcome: null,
    refund_amount: null,
    refund_status: 'none',
    created_at: daysAgo(2),
  });

  // Ticket 3: Refund on-going
  const c3 = db.collection('complaints').doc();
  batch.set(c3, {
    id: c3.id,
    store_id: STORE_ID,
    customer_name: 'Customer 5092',
    customer_phone: '0857-9653-5092',
    title: 'Service downtime — requesting partial refund',
    description: 'Customer experienced 8 days of service interruption due to the master account being temporarily suspended by Netflix. Requesting a proportional refund of IDR 8,000 for the lost period.',
    status: 'investigating',
    priority: 'medium',
    satisfaction_outcome: null,
    refund_amount: 8000,
    refund_status: 'processing',
    created_at: daysAgo(4),
  });

  // Ticket 4: Resolved
  const c4 = db.collection('complaints').doc();
  batch.set(c4, {
    id: c4.id,
    store_id: STORE_ID,
    customer_name: 'Customer 8364',
    customer_phone: '0831-9973-8364',
    title: 'Wrong profile assigned — needed kids profile',
    description: 'Customer was assigned adult profile instead of kids profile. Issue was resolved by reassigning the correct profile slot without service interruption.',
    status: 'resolved',
    priority: 'low',
    satisfaction_outcome: 'Profile successfully reassigned to the correct kids slot. Customer confirmed satisfaction.',
    refund_amount: null,
    refund_status: 'none',
    created_at: daysAgo(7),
  });

  console.log(`  Created 4 complaint tickets`);

  // ── 5. DIVERSE ORDER STATES ──────────────────────────────────────────────────
  console.log('5. Injecting diverse order states...');

  // Order A: Just In — Unpaid, Unfulfilled
  const o1 = db.collection('orders').doc();
  batch.set(o1, {
    id: o1.id,
    store_id: STORE_ID,
    customer_id: 'sim-cust-001',
    customer_name: 'Customer 7890',
    customer_phone: '0812-4567-7890',
    items: [{ name: 'Netflix 1 BULAN 2U', variant: '2U', duration_days: 30, device: 'hp samsung' }],
    total_amount: 30000,
    payment_status: 'unpaid',
    fulfillment_status: 'unfulfilled',
    created_at: new Date().toISOString(),
  });

  // Order B: Pending Payment, Unfulfilled
  const o2 = db.collection('orders').doc();
  batch.set(o2, {
    id: o2.id,
    store_id: STORE_ID,
    customer_id: 'sim-cust-002',
    customer_name: 'Customer 2233',
    customer_phone: '0852-1122-2233',
    items: [{ name: 'Netflix 3 BULAN 2U', variant: '2U', duration_days: 90, device: 'laptop asus' }],
    total_amount: 85000,
    payment_status: 'pending',
    fulfillment_status: 'unfulfilled',
    created_at: daysAgo(1),
  });

  // Order C: Paid, NOT YET Fulfilled
  const o3 = db.collection('orders').doc();
  batch.set(o3, {
    id: o3.id,
    store_id: STORE_ID,
    customer_id: 'sim-cust-003',
    customer_name: 'Customer 4411',
    customer_phone: '0895-3344-4411',
    items: [{ name: 'Netflix 1 BULAN 2U', variant: '2U', duration_days: 30, device: 'iphone 14' }],
    total_amount: 30000,
    payment_status: 'paid',
    fulfillment_status: 'unfulfilled',
    created_at: daysAgo(1),
  });

  // Order D: Paid AND Fulfilled (Processed)
  const o4 = db.collection('orders').doc();
  batch.set(o4, {
    id: o4.id,
    store_id: STORE_ID,
    customer_id: 'sim-cust-004',
    customer_name: 'Customer 9988',
    customer_phone: '0821-9988-7766',
    items: [{ name: 'Netflix 1 BULAN 2U', variant: '2U', duration_days: 30, device: 'tv sharp' }],
    total_amount: 30000,
    payment_status: 'paid',
    fulfillment_status: 'fulfilled',
    created_at: daysAgo(3),
  });

  console.log(`  Created 4 diverse order states`);

  // ── COMMIT ───────────────────────────────────────────────────────────────────
  await batch.commit();
  console.log('\n✅ All simulations committed successfully!');
  console.log('Summary:');
  console.log('  ✓ Store upgraded to Lifetime Pro');
  console.log('  ✓ 2 expired accounts + 1 expiring-soon account');
  console.log('  ✓ 2 banned customers');
  console.log('  ✓ 4 complaint tickets (open, investigating x2, resolved)');
  console.log('  ✓ 4 orders (unpaid, pending, paid-unfulfilled, paid-fulfilled)');
  process.exit(0);
}

run().catch(console.error);
