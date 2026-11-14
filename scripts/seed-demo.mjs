// Seeds a complete demo account into the real Firebase project, so every screen of the
// dashboard and storefront has something to show:
//
//   • login  demo@dionycte.com  (password printed at the end, or DEMO_PASSWORD)
//   • plan   Ultimate, 1 year
//   • store  "Dionycte"  — slug dionycte, custom domain dionycte.com, Bento template
//   • 7 products (one flash sale, one bundle), ~60 vault credentials (encrypted),
//     ~40 orders over the last 30 days (paid / pending / failed, a warranty claim, an
//     order waiting for stock, affiliate codes, payouts owed and paid), a broadcast,
//     and the Ultimate subscription payment.
//
// Run from the dashboard folder (needs the same .env.local the app uses):
//
//   npm run seed:demo
//
// or, without a computer, from GitHub: Actions → "Seed demo account" → Run workflow.
//
// Safe to re-run: every run first deletes the previous demo data (everything belonging to
// store id "demo-dionycte"), then writes it fresh. It never touches other stores.

import { createCipheriv, randomBytes } from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "web-store-dashboard";
const STORE_ID = "demo-dionycte";
const SLUG = "dionycte";
const DOMAIN = "dionycte.com";
const EMAIL = "demo@dionycte.com";
const DAY = 86_400_000;

// ---------------------------------------------------------------------------------------
// Setup

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function privateKey(raw) {
  if (!raw) return undefined;
  const text = raw.replace(/\\n/g, "\n");
  const m = text.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
  const body = (m ? m[1] : text).replace(/[^A-Za-z0-9+/=]/g, "");
  return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g).join("\n")}\n-----END PRIVATE KEY-----\n`;
}

if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  fail("FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are missing. Run this from the dashboard folder with `npm run seed:demo` so .env.local is loaded.");
}
const vaultKey = Buffer.from(process.env.VAULT_ENCRYPTION_KEY ?? "", "base64");
if (vaultKey.length !== 32) {
  fail("VAULT_ENCRYPTION_KEY is missing or not 32 bytes. Use the SAME value as on Vercel, otherwise the deployed dashboard can't read the demo vault.");
}

initializeApp({
  credential: cert({ projectId: PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: privateKey(process.env.FIREBASE_PRIVATE_KEY) }),
});
const db = getFirestore();
const auth = getAuth();

// Same format as src/lib/vault-crypto.ts: enc:v1:<iv>:<tag>:<ciphertext>, AES-256-GCM.
function encrypt(plain) {
  if (!plain) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", vaultKey, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `enc:v1:${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}

// Deterministic randomness so every run produces the same-looking demo.
let seed = 20261114;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const pick = (list) => list[Math.floor(rand() * list.length)];
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const code = (n) => Array.from({ length: n }, () => ALPHABET[Math.floor(rand() * ALPHABET.length)]).join("");
const ts = (ms) => Timestamp.fromMillis(ms);
const now = Date.now();

// ---------------------------------------------------------------------------------------
// 1. Login account

const password = process.env.DEMO_PASSWORD || `Demo-${randomBytes(4).toString("hex")}`;
let uid;
try {
  uid = (await auth.getUserByEmail(EMAIL)).uid;
  await auth.updateUser(uid, { password, emailVerified: true, displayName: "Demo Dionycte" });
} catch (err) {
  if (err?.code !== "auth/user-not-found") throw err;
  uid = (await auth.createUser({ email: EMAIL, password, emailVerified: true, displayName: "Demo Dionycte" })).uid;
}

// ---------------------------------------------------------------------------------------
// 2. Refuse to steal the slug/domain from a real store

for (const [col, id] of [["store_slugs", SLUG], ["store_domains", DOMAIN]]) {
  const snap = await db.collection(col).doc(id).get();
  if (snap.exists && snap.get("store_id") !== STORE_ID) {
    const owner = await db.collection("stores").doc(snap.get("store_id")).get();
    fail(
      `${col === "store_slugs" ? "Slug" : "Domain"} "${id}" is already used by store "${owner.get("store_name") ?? snap.get("store_id")}". ` +
        `Remove it there first (dashboard → Pengaturan), then run this again.`,
    );
  }
}

// ---------------------------------------------------------------------------------------
// 3. Wipe the previous demo

async function deleteWhere(col) {
  const snap = await db.collection(col).where("store_id", "==", STORE_ID).get();
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = db.batch();
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return snap.size;
}
const wiped = [];
for (const col of ["orders", "credentials_vault", "products", "broadcasts"]) wiped.push(`${await deleteWhere(col)} ${col}`);
const oldSubs = await db.collection("subscription_payments").where("uid", "==", uid).get();
await Promise.all(oldSubs.docs.map((d) => d.ref.delete()));

// ---------------------------------------------------------------------------------------
// 4. User, store, indexes

await db.collection("users").doc(uid).set({
  email: EMAIL,
  full_name: "Demo Dionycte",
  subscription_tier: "ultimate",
  subscription_expiry: ts(now + 365 * DAY),
  created_at: ts(now - 45 * DAY),
});

const storeRef = db.collection("stores").doc(STORE_ID);
await storeRef.set({
  owner_uid: uid,
  store_name: "Dionycte",
  slug: SLUG,
  custom_domain: DOMAIN,
  custom_domain_status: { state: "pending", checks: { attached: false, dns: false, live: false }, message: null, checked_at: null },
  storefront_config: {
    layout_template: "template_a_bento",
    accent_color: "#7C3AED",
    tagline: "Akun premium resmi, kirim instan ke WhatsApp. Bergaransi.",
    banner_url: "",
    logo_url: "",
  },
  is_active: true,
  suspended: false,
  store_info: {
    about:
      "Dionycte menjual akun premium resmi sejak 2024. Semua akun dicek sebelum dikirim, dan dikirim otomatis ke WhatsApp Anda begitu pembayaran masuk — 24 jam.",
    faq: [
      { q: "Berapa lama akun dikirim?", a: "Otomatis dalam 1–2 menit setelah pembayaran berhasil, langsung ke WhatsApp." },
      { q: "Apakah akunnya bergaransi?", a: "Ya, bergaransi penuh selama masa aktif. Klaim lewat halaman Lacak pesanan." },
      { q: "Pembayaran pakai apa saja?", a: "QRIS, OVO, DANA, ShopeePay dan transfer virtual account." },
    ],
    warranty_policy:
      "Garansi penuh selama masa aktif akun. Jika akun tidak bisa dipakai, klaim lewat halaman Lacak pesanan atau menu Akun → Pesanan. Akun pengganti dikirim maksimal 1×24 jam. Garansi tidak berlaku jika password atau profil diubah oleh pembeli.",
    whatsapp: "+6281234567890",
  },
  created_at: ts(now - 44 * DAY),
});
await storeRef.collection("private").doc("integrations").set({
  xendit_sub_account_id: null,
  xendit_account_status: null,
  wa_api_provider: null,
  wa_api_token: null,
  wa_message_template:
    "Halo! Terima kasih sudah order {product} di {store}.\n\nEmail: {email}\nPassword: {password}\nPIN: {pin}\nAktif s/d: {expiry}\n\nOrder ID: {order_id}",
});
await db.collection("store_slugs").doc(SLUG).set({ store_id: STORE_ID });
await db.collection("store_domains").doc(DOMAIN).set({ store_id: STORE_ID });

// ---------------------------------------------------------------------------------------
// 5. Products

const PRODUCTS = [
  { key: "netflix", title: "Netflix Premium 1 Bulan", type: "Media", price: 45_000, days: 30, stock: 12, sold: 12,
    description: "1 profil pribadi, kualitas Ultra HD 4K. Bisa di TV, HP dan laptop." },
  { key: "spotify", title: "Spotify Premium 1 Bulan", type: "Music", price: 25_000, days: 30, stock: 10, sold: 8,
    description: "Akun individual, tanpa iklan, download lagu offline." },
  { key: "youtube", title: "YouTube Premium 1 Bulan", type: "Media", price: 20_000, days: 30, stock: 8, sold: 6,
    description: "Tanpa iklan, putar di background, termasuk YouTube Music." },
  { key: "chatgpt", title: "ChatGPT Plus 1 Bulan", type: "AI", price: 150_000, days: 30, stock: 4, sold: 5,
    description: "Akses model terbaru, analisis file dan gambar, prioritas saat ramai.",
    flash: { price: 129_000, endsInDays: 3 } },
  { key: "canva", title: "Canva Pro 1 Bulan", type: "Productivity", price: 30_000, days: 30, stock: 6, sold: 4,
    description: "Semua template premium, hapus background, brand kit." },
  { key: "vpn", title: "NordVPN 3 Bulan", type: "VPN", price: 60_000, days: 90, stock: 0, sold: 3,
    description: "6 perangkat, server 60+ negara. (Demo: stok habis.)" },
];
const BUNDLE = { key: "bundle", title: "Paket Hiburan: Netflix + Spotify", type: "Media", price: 62_000, days: 30,
  description: "Hemat Rp 8.000 dibanding beli terpisah. Satu order, dua akun.", items: ["netflix", "spotify"] };

// Letters and digits only, like Firestore auto-ids: the storefront rejects anything else in /checkout/<id>.
const productId = (key) => `demoDionycte${key[0].toUpperCase()}${key.slice(1)}`;
const writes = [];
for (const p of PRODUCTS) {
  writes.push(db.collection("products").doc(productId(p.key)).set({
    store_id: STORE_ID,
    title: p.title,
    description: p.description,
    image_url: null,
    platform_type: p.type,
    price: p.price,
    duration_days: p.days,
    is_flash_sale: !!p.flash,
    bundle_items: null,
    flash_sale_price: p.flash?.price ?? null,
    flash_sale_ends_at: p.flash ? ts(now + p.flash.endsInDays * DAY) : null,
    is_published: true,
    stock_available: p.stock,
    created_at: ts(now - 40 * DAY),
    updated_at: ts(now - 2 * DAY),
  }));
}
writes.push(db.collection("products").doc(productId(BUNDLE.key)).set({
  store_id: STORE_ID,
  title: BUNDLE.title,
  description: BUNDLE.description,
  image_url: null,
  platform_type: BUNDLE.type,
  price: BUNDLE.price,
  duration_days: BUNDLE.days,
  is_flash_sale: false,
  bundle_items: BUNDLE.items.map(productId),
  flash_sale_price: null,
  flash_sale_ends_at: null,
  is_published: true,
  stock_available: 0, // bundles have no stock of their own; the storefront uses min(components)
  created_at: ts(now - 20 * DAY),
  updated_at: ts(now - 2 * DAY),
}));
await Promise.all(writes);

// ---------------------------------------------------------------------------------------
// 6. Vault + orders

const CUSTOMERS = [
  ["andi", "Andi"], ["budi", "Budi"], ["citra", "Citra"], ["dewi", "Dewi"], ["eka", "Eka"],
  ["fajar", "Fajar"], ["gita", "Gita"], ["hana", "Hana"], ["indra", "Indra"], ["joko", "Joko"],
  ["kirana", "Kirana"], ["lestari", "Lestari"], ["maya", "Maya"], ["nanda", "Nanda"], ["putri", "Putri"],
];
const REFERRALS = ["ANDIREF", "PROMOKAMPUS", "TIKTOK10"];
const FEE_PERCENT = 1; // Ultimate

const batchOps = [];
let credSeq = 0;
function credential(productKey, { status, orderId = null, soldAt = null, expiry }) {
  const id = `demoDionycteCred${String(++credSeq).padStart(3, "0")}`;
  const n = credSeq;
  batchOps.push([db.collection("credentials_vault").doc(id), {
    store_id: STORE_ID,
    product_id: productId(productKey),
    account_email: `${productKey}.${String(n).padStart(3, "0")}@akundemo.id`,
    account_password: encrypt(`Pw-${code(6)}`),
    profile_pin: productKey === "netflix" ? encrypt(String(1000 + Math.floor(rand() * 9000))) : "",
    status,
    expiry_date: expiry ? ts(expiry) : null,
    order_id: orderId,
    created_at: ts(now - 35 * DAY),
    sold_at: soldAt ? ts(soldAt) : null,
  }]);
  return id;
}

// Available stock.
for (const p of PRODUCTS) for (let i = 0; i < p.stock; i++) credential(p.key, { status: "AVAILABLE", expiry: now + (p.days + 20) * DAY });
// A little extra Netflix/Spotify stock, so the bundle shows as available too.
for (let i = 0; i < 3; i++) {
  credential("netflix", { status: "AVAILABLE", expiry: now + 50 * DAY });
  credential("spotify", { status: "AVAILABLE", expiry: now + 50 * DAY });
}
// Keep the denormalised counters exact.
await db.collection("products").doc(productId("netflix")).update({ stock_available: PRODUCTS[0].stock + 3 });
await db.collection("products").doc(productId("spotify")).update({ stock_available: PRODUCTS[1].stock + 3 });

const orders = [];
const usedIds = new Set();
function orderId() {
  let id;
  do id = `ORD-${code(8)}`; while (usedIds.has(id));
  usedIds.add(id);
  return id;
}

function order(product, { daysAgo, status = "PAID", settlement, warranty = null, needsStock = false, deliveryError = null }) {
  const id = orderId();
  const [handle] = pick(CUSTOMERS);
  const created = now - daysAgo * DAY - Math.floor(rand() * 10) * 3_600_000;
  const paid = status === "PAID" ? created + 4 * 60_000 : null;
  const isBundle = !!product.items;
  const amount = product.flash && daysAgo < 3 ? product.flash.price : product.price;
  const access = paid ? paid + product.days * DAY : null;

  const credentialIds = [];
  if (status === "PAID" && !needsStock) {
    for (const key of isBundle ? product.items : [product.key]) {
      credentialIds.push(credential(key, { status: "SOLD", orderId: id, soldAt: paid, expiry: access }));
    }
  }
  const fee = Math.round((amount * FEE_PERCENT) / 100);
  const settle = status === "PAID" ? (settlement ?? (daysAgo > 7 ? "PLATFORM" : pick(["PLATFORM", "MANUAL"]))) : "PLATFORM";
  orders.push([db.collection("orders").doc(id), {
    store_id: STORE_ID,
    product_id: productId(product.key),
    product_title: product.title,
    amount,
    credential_id: credentialIds[0] ?? null,
    credential_ids: credentialIds,
    customer_contact: { email: `${handle}${Math.floor(rand() * 90 + 10)}@example.com`, phone: `62812${String(10_000_000 + Math.floor(rand() * 89_999_999))}` },
    payment_status: status,
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    delivery_status: status === "PAID" && !needsStock && !deliveryError ? "SENT_VIA_WA" : "PENDING",
    delivery_error: deliveryError,
    warranty_status: warranty ? "CLAIMED" : "VALID",
    warranty_claim: warranty ? { reason: warranty, claimed_at: ts(paid + 2 * DAY) } : null,
    needs_stock: needsStock,
    renewal_notified: !!access && access - now < 3 * DAY,
    referral_code: rand() < 0.25 ? pick(REFERRALS) : null,
    settlement: settle,
    platform_fee: status === "PAID" ? fee : 0,
    payout_status: status === "PAID" && settle === "PLATFORM" ? (daysAgo > 7 ? "PAID_OUT" : "OWED") : null,
    created_at: ts(created),
    paid_at: paid ? ts(paid) : null,
    access_expires_at: access ? ts(access) : null,
  }]);
  return id;
}

// Paid sales spread over the last 30 days, weighted to each product's "sold" count.
for (const p of PRODUCTS) for (let i = 0; i < p.sold; i++) order(p, { daysAgo: Math.floor(rand() * 30) });
for (let i = 0; i < 3; i++) order({ ...BUNDLE }, { daysAgo: Math.floor(rand() * 15) });
// The interesting cases.
const claimId = order(PRODUCTS[0], { daysAgo: 5, warranty: "Password tidak bisa dipakai login sejak kemarin." });
const needsStockId = order(PRODUCTS[5], { daysAgo: 1, needsStock: true }); // VPN sold out after payment
const deliveryErrorId = order(PRODUCTS[1], { daysAgo: 0, deliveryError: "WhatsApp belum dikonfigurasi di Pengaturan." });
const pendingId = order(PRODUCTS[3], { daysAgo: 0, status: "PENDING" });
order(PRODUCTS[2], { daysAgo: 2, status: "PENDING" });
order(PRODUCTS[4], { daysAgo: 6, status: "FAILED" });


// ---------------------------------------------------------------------------------------
// 6b. A buyer account: signs in on the storefront and sees their orders, profile and claim

const claimOrder = orders.find(([ref]) => ref.id === claimId)[1];
const BUYER_EMAIL = claimOrder.customer_contact.email;
let buyerUid;
try {
  buyerUid = (await auth.getUserByEmail(BUYER_EMAIL)).uid;
  await auth.updateUser(buyerUid, { password, emailVerified: true, displayName: "Indra Pembeli" });
} catch (err) {
  if (err?.code !== "auth/user-not-found") throw err;
  buyerUid = (await auth.createUser({ email: BUYER_EMAIL, password, emailVerified: true, displayName: "Indra Pembeli" })).uid;
}
await db.collection("customers").doc(buyerUid).set({
  email: BUYER_EMAIL,
  name: "Indra Pembeli",
  phone: claimOrder.customer_contact.phone,
  saved_checkout: { last_channel: "OVO" },
  created_at: ts(now - 20 * DAY),
});
// Give them a realistic history: three more paid orders become theirs.
for (const [, o] of orders.filter(([ref, o]) => ref.id !== claimId && o.payment_status === "PAID" && !o.needs_stock && !o.delivery_error).slice(0, 3)) {
  o.customer_contact = { ...claimOrder.customer_contact };
}
// Half of their orders were placed signed in; the rest get linked on first visit (verified email).
let linkedCount = 0;
for (const [, o] of orders) {
  if (o.customer_contact.email === BUYER_EMAIL && linkedCount++ % 2 === 0) o.customer_uid = buyerUid;
}

for (let i = 0; i < batchOps.length + orders.length; i += 400) {
  const batch = db.batch();
  [...batchOps, ...orders].slice(i, i + 400).forEach(([ref, data]) => batch.set(ref, data));
  await batch.commit();
}

// ---------------------------------------------------------------------------------------
// 7. Marketing + billing history

await db.collection("broadcasts").doc(`${STORE_ID}-bc-1`).set({
  store_id: STORE_ID,
  message: "Flash sale ChatGPT Plus cuma Rp 129.000 sampai 3 hari lagi! Order di dionycte.com",
  audience: "all",
  product_id: null,
  recipients: CUSTOMERS.length,
  status: "SENT",
  error: null,
  created_at: ts(now - 1 * DAY),
});
await db.collection("subscription_payments").doc(`SUB-${code(8)}`).set({
  uid,
  tier: "ultimate",
  period: "yearly",
  amount: 2_490_000,
  status: "PAID",
  xendit_invoice_id: null,
  xendit_invoice_url: null,
  created_at: ts(now - 44 * DAY),
  paid_at: ts(now - 44 * DAY),
});

// ---------------------------------------------------------------------------------------

const claimEmail = orders.find(([ref]) => ref.id === claimId)[1].customer_contact.email;
const paidCount = orders.filter(([, o]) => o.payment_status === "PAID").length;
console.log(`
✔ Demo ready  (removed old: ${wiped.join(", ")})

  Login        ${EMAIL}
  Password     ${process.env.DEMO_PASSWORD ? "(the DEMO_PASSWORD you set)" : password}
  Plan         Ultimate (1 year)

  Store        Dionycte — slug "${SLUG}", domain ${DOMAIN}, store id ${STORE_ID}
  Products     ${PRODUCTS.length + 1} (flash sale: ChatGPT Plus, bundle: Netflix + Spotify, VPN sold out)
  Vault        ${credSeq} credentials (encrypted)
  Orders       ${orders.length} (${paidCount} paid, 2 pending, 1 failed)

  Buyer login  ${BUYER_EMAIL} (same password) — storefront /masuk

  Try these:
    Storefront (local)   http://localhost:3001/${SLUG}
    Track a claim        order ${claimId} + email ${claimEmail}
    Pending payment      ${pendingId}
    Waiting for stock    ${needsStockId}   (add NordVPN stock in Brankas to fulfil it)
    Delivery failed      ${deliveryErrorId}
`);
process.exit(0);
