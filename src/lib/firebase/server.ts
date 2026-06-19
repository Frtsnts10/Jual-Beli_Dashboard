import { getApp, getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
        : undefined,
    }),
  });
}

export const adminDb = new Proxy(
  {} as ReturnType<typeof getFirestore>,
  {
    get(_target, prop) {
      const db = getFirestore(getAdminApp());
      return (db as any)[prop];
    },
  }
);

export const adminAuth = new Proxy(
  {} as ReturnType<typeof getAuth>,
  {
    get(_target, prop) {
      const auth = getAuth(getAdminApp());
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
  } catch {
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
