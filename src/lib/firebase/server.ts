import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

function formatPrivateKey(key?: string) {
  if (!key) return undefined;
  
  const cleaned = key.replace(/\\n/g, '\n').replace(/"/g, '').replace(/'/g, '');
  
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';
  
  if (cleaned.includes(header) && cleaned.includes(footer)) {
    let base64Part = cleaned.replace(header, '').replace(footer, '');
    base64Part = base64Part.replace(/\s+/g, '');
    const chunks = base64Part.match(/.{1,64}/g) || [];
    return `${header}\n${chunks.join('\n')}\n${footer}`;
  }
  
  return cleaned;
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    }),
  });
}

export const adminDb = new Proxy(
  {} as ReturnType<typeof getFirestore>,
  {
    get(_target, prop) {
      const db = getFirestore(getAdminApp());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (db as any)[prop];
    },
  }
);

export const adminAuth = new Proxy(
  {} as ReturnType<typeof getAuth>,
  {
    get(_target, prop) {
      const auth = getAuth(getAdminApp());
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (auth as any)[prop];
    },
  }
);

/**
 * Verifies the session cookie and returns the decoded user or null.
 * This replaces `createServerSupabase().auth.getUser()`.
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;

    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded;
  } catch (err: unknown) {
    console.error("verifySessionCookie failed:", err);
    return null;
  }
}

/**
 * Gets the full user profile including role from Firestore.
 */
export async function getUserProfile() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const doc = await adminDb.collection("profiles").doc(user.uid).get();
  if (!doc.exists) return { uid: user.uid, role: "admin", email: user.email, name: user.name };

  const data = doc.data()!;
  return {
    uid: user.uid,
    email: data.email || user.email,
    name: data.full_name || user.name || "Workspace Admin",
    role: data.role || "admin"
  };
}

/**
 * Creates a session cookie from a Firebase ID token.
 * Call this from your sign-in API route after the client signs in.
 */
export async function createSessionCookie(idToken: string) {
  const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
  return { sessionCookie, expiresIn };
}

/**
 * Strictly verifies if the currently authenticated user owns the given storeId.
 * Used by all Server Actions to prevent unauthorized cross-tenant data access.
 */
export async function verifyStoreAccess(storeId: string): Promise<boolean> {
  const user = await getAuthenticatedUser();
  if (!user) return false;

  try {
    const storeSnap = await adminDb.collection("stores").doc(storeId).get();
    if (!storeSnap.exists) return false;
    
    const storeData = storeSnap.data();
    return storeData?.owner_id === user.uid;
  } catch (err) {
    console.error("verifyStoreAccess failed:", err);
    return false;
  }
}
