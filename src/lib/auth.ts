import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { mapStore, mapUser } from "@/lib/firestore-mappers";
import type { Store, UserDoc } from "@/types/schema";

export const SESSION_COOKIE = "session";

/** The verified session, or null. Cached per request. */
export const getSessionUser = cache(async () => {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    return await adminAuth.verifySessionCookie(session, true);
  } catch {
    return null;
  }
});

export const getCurrentUser = cache(async (): Promise<UserDoc | null> => {
  const session = await getSessionUser();
  if (!session) return null;
  const snap = await adminDb.collection("users").doc(session.uid).get();
  if (!snap.exists) {
    return {
      uid: session.uid,
      email: session.email ?? "",
      full_name: (session.name as string) ?? "",
      subscription_tier: "starter",
      subscription_expiry: null,
      created_at: "",
    };
  }
  return mapUser(snap);
});

export async function requireUser(): Promise<UserDoc> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export const getOwnedStores = cache(async (uid: string): Promise<Store[]> => {
  const snap = await adminDb.collection("stores").where("owner_uid", "==", uid).get();
  return snap.docs.map(mapStore).sort((a, b) => a.created_at.localeCompare(b.created_at));
});

/**
 * Loads a store and asserts the signed-in user owns it. Every server action that
 * touches store data goes through this, which is what keeps tenants isolated.
 */
export const requireStore = cache(async (storeId: string): Promise<{ user: UserDoc; store: Store }> => {
  const user = await requireUser();
  const snap = await adminDb.collection("stores").doc(storeId).get();
  if (!snap.exists || snap.get("owner_uid") !== user.uid) notFound();
  return { user, store: mapStore(snap) };
});
