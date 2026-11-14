import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

/**
 * Adds uid as an admin of a store: the admin_uids array drives access checks and the
 * "stores I can open" query; stores/{id}/members/{uid} keeps display details.
 */
export async function addStoreAdmin(storeId: string, uid: string, email: string, invitedBy: string) {
  const storeRef = adminDb.collection("stores").doc(storeId);
  const batch = adminDb.batch();
  batch.update(storeRef, { admin_uids: FieldValue.arrayUnion(uid) });
  batch.set(storeRef.collection("members").doc(uid), { email, role: "admin", invited_by: invitedBy, added_at: FieldValue.serverTimestamp() });
  await batch.commit();
}

/** Turns invitations sent to an email before the person had an account into memberships. */
export async function acceptPendingInvites(uid: string, email: string | undefined) {
  if (!email) return 0;
  const invites = await adminDb.collection("store_invites").where("email", "==", email.toLowerCase()).get();
  for (const invite of invites.docs) {
    const store = await adminDb.collection("stores").doc(invite.get("store_id")).get();
    if (store.exists && store.get("owner_uid") !== uid) {
      await addStoreAdmin(store.id, uid, email.toLowerCase(), invite.get("invited_by"));
    }
    await invite.ref.delete();
  }
  return invites.size;
}
