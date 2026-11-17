// Creates (or resets) a platform admin login in the real Firebase project:
//
//   ADMIN_EMAIL=admin@dionycte.com ADMIN_PASSWORD=… npm run create:admin
//
// or from GitHub: Actions → "Create platform admin" → Run workflow.
//
// The account gets a verified email (the admin panel requires one) and a dashboard profile.
// It only becomes an admin once its email is in PLATFORM_ADMIN_EMAILS on Vercel — this script
// can't change that, it only reminds you.

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = "web-store-dashboard";

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

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fail("ADMIN_EMAIL is missing or not an email address.");
if (password.length < 10) fail("ADMIN_PASSWORD is missing or shorter than 10 characters.");
if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) fail("FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are missing.");

initializeApp({
  credential: cert({ projectId: PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: privateKey(process.env.FIREBASE_PRIVATE_KEY) }),
});
const auth = getAuth();
const db = getFirestore();

let uid;
let created = false;
try {
  uid = (await auth.getUserByEmail(email)).uid;
  await auth.updateUser(uid, { password, emailVerified: true, disabled: false });
} catch (err) {
  if (err?.code !== "auth/user-not-found") throw err;
  uid = (await auth.createUser({ email, password, emailVerified: true, displayName: "Admin Platform" })).uid;
  created = true;
}

// The dashboard profile normally appears on first sign-in; create it so the account is complete.
const ref = db.collection("users").doc(uid);
if (!(await ref.get()).exists) {
  await ref.set({ email, full_name: "Admin Platform", subscription_tier: "starter", subscription_expiry: null, created_at: Timestamp.now() });
}

const admins = (process.env.PLATFORM_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
console.log(`
✔ Admin login ${created ? "created" : "updated (password reset, email verified)"}

  Email      ${email}
  Password   (the ADMIN_PASSWORD you set)
  Sign in    <dashboard>/sign-in, then open /platform

  ${admins.includes(email) ? "" : `Next: add ${email} to PLATFORM_ADMIN_EMAILS on Vercel (comma-separated) and redeploy —\n  until then this account is a normal seller and /platform answers 404.`}
`);
process.exit(0);
