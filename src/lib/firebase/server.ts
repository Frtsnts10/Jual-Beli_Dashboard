import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb: admin.firestore.Firestore = new Proxy(
  {} as admin.firestore.Firestore,
  {
    get(_target, prop) {
      const db = getAdminApp().firestore();
      return (db as any)[prop];
    },
  }
);

export const adminAuth: admin.auth.Auth = new Proxy(
  {} as admin.auth.Auth,
  {
    get(_target, prop) {
      const auth = getAdminApp().auth();
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
