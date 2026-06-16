import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
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

// We need a STORE ID. We will use the 'Dionycte' store ID since that matches the screenshot.
const STORE_ID = "4lHojACGdUrNKQDhocrt";

const excelData = [
  // PASS: dompet
  { username: '0838-9840-3974', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'upin', duration: 30, type: '2U', orderDate: '2026-05-24', expDate: '2026-06-24', device: 'laptop lenovo', group: 'dompet' },
  { username: '0819-1709-3555', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'upin', duration: 30, type: '2U', orderDate: '2026-05-26', expDate: '2026-06-26', device: 'tv cocoa', group: 'dompet' },
  { username: '0857-9704-9972', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'ipin', duration: 30, type: '2U', orderDate: '2026-05-23', expDate: '2026-06-23', device: 'tab vista', group: 'dompet' },
  { username: '0896-9942-4275', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'ipin', duration: 30, type: '2U', orderDate: '2026-05-23', expDate: '2026-06-23', device: 'hp redmi', group: 'dompet' },
  { username: '0813-9080-1492', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'mail', duration: 30, type: '2U', orderDate: '2026-05-23', expDate: '2026-06-23', device: 'laptop asus', group: 'dompet' },
  { username: '0896-3569-3278', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'mail', duration: 30, type: '2U', orderDate: '2026-05-24', expDate: '2026-06-24', device: 'hp android', group: 'dompet' },
  { username: '0812-2331-3299', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'fizi', duration: 30, type: '2U', orderDate: '2026-05-23', expDate: '2026-06-23', device: 'tv xiaomi', group: 'dompet' },
  { username: '0815-7578-6144', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'fizi', duration: 30, type: '2U', orderDate: '2026-05-23', expDate: '2026-06-23', device: 'laptop ROG', group: 'dompet' },
  { username: '0812-2486-1991', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'jarjit', duration: 60, type: '2U', orderDate: '2026-04-27', expDate: '2026-06-27', device: 'tab poco', group: 'dompet' },
  { username: '0894-0407-0927', email: 'netflixnetflixku123@gmail.com', password: 'dompet', profile: 'jarjit', duration: 30, type: '2U', orderDate: '2026-05-24', expDate: '2026-06-24', device: 'hp oppo', group: 'dompet' },

  // PASS: ketupat
  { username: '0857-9653-5092', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'sun', duration: 30, type: '2U', orderDate: '2026-05-29', expDate: '2026-06-29', device: 'tab samsung', group: 'ketupat' },
  { username: '0896-9942-4275', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'sun', duration: 30, type: '2U', orderDate: '2026-05-01', expDate: '2026-06-01', device: 'hp redmi', group: 'ketupat' },
  { username: '0822-6142-3996', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'moon', duration: 30, type: '2U', orderDate: '2026-05-28', expDate: '2026-06-28', device: 'hp samsung', group: 'ketupat' },
  { username: '0895-3393-74016', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'moon', duration: 30, type: '2U', orderDate: '2026-04-28', expDate: '2026-05-28', device: 'tv polytron', group: 'ketupat' },
  { username: '0857-1284-3598', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'star', duration: 30, type: '2U', orderDate: '2026-05-02', expDate: '2026-06-02', device: 'xiaomi pad', group: 'ketupat' },
  { username: '0813-8999-8756', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'star', duration: 30, type: '2U', orderDate: '2026-05-29', expDate: '2026-06-29', device: 'hp andro', group: 'ketupat' },
  { username: '0895-0487-6719', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'world', duration: 30, type: '2U', orderDate: '2026-05-29', expDate: '2026-06-29', device: 'laptop', group: 'ketupat' },
  { username: '0895-0893-7107', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'world', duration: 30, type: '2U', orderDate: '2026-05-29', expDate: '2026-06-29', device: 'iphone', group: 'ketupat' },
  { username: '0852-1498-3087', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'planet', duration: 90, type: '2U', orderDate: '2026-04-06', expDate: '2026-07-06', device: 'hp oppo', group: 'ketupat' },
  { username: '0813-4181-5816', email: 'akunaruhi@gmail.com', password: 'ketupat', profile: 'planet', duration: 30, type: '2U', orderDate: '2026-05-29', expDate: '2026-06-29', device: 'hp itel', group: 'ketupat' },

  // PASS: Harimau
  { username: '0821-4414-4939', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'adit', duration: 30, type: '2U', orderDate: '2026-06-03', expDate: '2026-07-03', device: 'ipad', group: 'Harimau' },
  { username: '0895-4125-50966', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'adit', duration: 30, type: '2U', orderDate: '2026-06-03', expDate: '2026-07-03', device: 'tv toshiba', group: 'Harimau' },
  { username: '0831-9973-8364', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'denis', duration: 30, type: '2U', orderDate: '2026-06-03', expDate: '2026-07-03', device: 'laptop', group: 'Harimau' },
  { username: '0823-4710-8582', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'denis', duration: 30, type: '2U', orderDate: '2026-06-04', expDate: '2026-07-04', device: 'tab huawei', group: 'Harimau' },
  { username: '0852-9853-2713', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'sopo', duration: 90, type: '2U', orderDate: '2026-06-01', expDate: '2026-09-01', device: 'tv polytron', group: 'Harimau' },
  { username: '0852-1399-4327', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'sopo', duration: 30, type: '2U', orderDate: '2026-06-02', expDate: '2026-07-02', device: 'iphone', group: 'Harimau' },
  { username: '0817-1717-0201', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'jarwo', duration: 30, type: '2U', orderDate: '2026-06-04', expDate: '2026-07-04', device: 'tv sharp', group: 'Harimau' },
  { username: '0821-2529-1191', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'jarwo', duration: 30, type: '2U', orderDate: '2026-06-03', expDate: '2026-07-03', device: 'iphone', group: 'Harimau' },
  { username: '0821-1272-4356', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'rw', duration: 90, type: '2U', orderDate: '2026-05-04', expDate: '2026-08-04', device: 'hp tecno', group: 'Harimau' },
  { username: '0821-1793-0289', email: 'ayoorder92@apksindflix.com', password: 'Harimau', profile: 'rw', duration: 30, type: '2U', orderDate: '2026-06-03', expDate: '2026-07-03', device: 'hp redmi', group: 'Harimau' },

  // PASS: berkati
  { username: '0895-0407-0927', email: 'nontonnetflix42@alflix.id', password: 'berkati', profile: 'kelinci', duration: 30, type: '2U', orderDate: '2026-06-12', expDate: '2026-07-12', device: 'tv LG', group: 'berkati' },
  { username: '0895-4125-50966', email: 'nontonnetflix42@alflix.id', password: 'berkati', profile: 'kelinci', duration: 30, type: '2U', orderDate: '2026-06-13', expDate: '2026-07-13', device: 'laptop lenovo', group: 'berkati' },
  { username: '0812-8728-5369', email: 'nontonnetflix42@alflix.id', password: 'berkati', profile: 'hamster', duration: 30, type: '2U', orderDate: '2026-06-13', expDate: '2026-07-13', device: 'iphone', group: 'berkati' },
  { username: '0852-5693-6263', email: 'nontonnetflix42@alflix.id', password: 'berkati', profile: 'hamster', duration: 30, type: '2U', orderDate: '2026-06-15', expDate: '2026-07-15', device: 'huawei matepad', group: 'berkati' },
];

async function seed() {
  console.log('Starting seed process...');
  const batch = db.batch();

  // Deduplicate users (customers)
  const customersMap = new Map();
  for (const item of excelData) {
    if (!customersMap.has(item.username)) {
      customersMap.set(item.username, {
        id: db.collection('customers').doc().id,
        phone: item.username,
        name: `Customer ${item.username.slice(-4)}`,
        total_orders: 0,
        purchased_products: []
      });
    }
  }

  // Deduplicate Master Accounts (Inventory)
  const masterAccountsMap = new Map();
  for (const item of excelData) {
    if (!masterAccountsMap.has(item.group)) {
      masterAccountsMap.set(item.group, {
        id: db.collection('inventory').doc().id,
        store_id: STORE_ID,
        name: `Netflix ${item.duration === 30 ? '1' : item.duration === 60 ? '2' : '3'} BULAN 2U`,
        profile_tier: item.type,
        profile_name: "Master Hub",
        email: item.email,
        password: item.password,
        base_price: item.duration === 30 ? 25000 : 70000,
        selling_price: item.duration === 30 ? 30000 : 85000,
        price: item.duration === 30 ? 30000 : 85000,
        stock: 1, // 1 Master Account = 1 Stock Unit (for Inventory Capital calculation)
        date_buy: new Date(item.orderDate).toISOString(),
        date_expired: new Date(item.expDate).toISOString(),
        category: "Streaming",
        group_name: `Netflix Shared Hub — ${item.group} (${item.email})`,
        created_at: new Date().toISOString()
      });
    }
  }

  // Create Inventory Items
  for (const master of masterAccountsMap.values()) {
    const invRef = db.collection('inventory').doc(master.id);
    batch.set(invRef, master);
  }

  // Create Orders and update Customers
  for (const item of excelData) {
    const cust = customersMap.get(item.username);
    const master = masterAccountsMap.get(item.group);

    // Track for customer
    cust.total_orders += 1;
    cust.purchased_products.push({
      name: master.name,
      variant: item.type,
      duration_days: item.duration,
      bought_date: master.date_buy,
      expire_date: master.date_expired,
      group_assigned: master.group_name,
      is_owner: false, 
      inventory_id: master.id,
      device_logged: item.device 
    });

    // Order Record
    const orderRef = db.collection('orders').doc();
    const orderData = {
      id: orderRef.id,
      store_id: STORE_ID,
      customer_id: cust.id,
      customer_name: cust.name,
      customer_phone: cust.phone,
      items: [
        {
          name: master.name,
          variant: item.type,
          duration_days: item.duration,
          bought_date: master.date_buy,
          expire_date: master.date_expired,
          inventory_id: master.id,
          device: item.device 
        }
      ],
      total_amount: master.selling_price,
      payment_status: "paid",
      fulfillment_status: "fulfilled",
      created_at: master.date_buy
    };
    batch.set(orderRef, orderData);
  }

  // Save all customers
  for (const cust of customersMap.values()) {
    const custRef = db.collection('customers').doc(cust.id);
    batch.set(custRef, {
      ...cust,
      store_id: STORE_ID,
      created_at: new Date().toISOString()
    });
  }

  console.log(`Committing batch with ${masterAccountsMap.size} inventory, ${excelData.length} orders, and ${customersMap.size} customers...`);
  await batch.commit();
  console.log('Seed completed successfully!');
  process.exit(0);
}

seed().catch(console.error);
