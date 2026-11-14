import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { effectiveTier, mapStore, mapUser } from "@/lib/firestore-mappers";
import type { Store, SubscriptionTier, UserDoc } from "@/types/schema";

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

/** Stores the user owns, oldest first. Plan store limits count only these. */
export const getOwnedStores = cache(async (uid: string): Promise<Store[]> => {
  const snap = await adminDb.collection("stores").where("owner_uid", "==", uid).get();
  return snap.docs.map(mapStore).sort((a, b) => a.created_at.localeCompare(b.created_at));
});

/** Stores the user can open: owned ones first, then those they were added to as admin. */
export const getAccessibleStores = cache(async (uid: string): Promise<Store[]> => {
  const [owned, shared] = await Promise.all([
    getOwnedStores(uid),
    adminDb.collection("stores").where("admin_uids", "array-contains", uid).get(),
  ]);
  return [...owned, ...shared.docs.map(mapStore).sort((a, b) => a.created_at.localeCompare(b.created_at))];
});

export type StoreRole = "owner" | "admin";

export interface StoreAccess {
  user: UserDoc;
  store: Store;
  role: StoreRole;
  /** The store owner's effective plan; limits and features follow the owner, not the admin. */
  tier: SubscriptionTier;
}

/**
 * Loads a store and asserts the signed-in user may manage it (owner, or an admin the owner
 * added). Every store-scoped page and server action goes through this, which is what keeps
 * tenants isolated. Pass { ownerOnly: true } for billing, team, payouts and domains.
 */
export const requireStore = cache(async (storeId: string, opts?: { ownerOnly?: boolean }): Promise<StoreAccess> => {
  const user = await requireUser();
  const snap = await adminDb.collection("stores").doc(storeId).get();
  if (!snap.exists) notFound();
  const store = mapStore(snap);
  const role: StoreRole | null =
    store.owner_uid === user.uid ? "owner" : ((snap.get("admin_uids") as string[] | undefined) ?? []).includes(user.uid) ? "admin" : null;
  if (!role) notFound();
  if (opts?.ownerOnly && role !== "owner") notFound();

  let tier = user.subscription_tier;
  if (role === "admin") {
    const owner = await adminDb.collection("users").doc(store.owner_uid).get();
    tier = effectiveTier(owner.get("subscription_tier"), owner.get("subscription_expiry"));
  }
  return { user, store, role, tier };
});
