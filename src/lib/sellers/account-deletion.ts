import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function deleteAll(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = adminDb.batch();
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * Carries out an approved seller deletion request. The seller's stores close for good
 * (suspended + inactive) and their stock vault is wiped, since it holds live account
 * passwords. Orders stay so buyers keep their receipts and history. The login, the dashboard
 * profile and any buyer profile go; the account is removed from stores it was an admin of.
 */
export async function deleteSellerAccount(uid: string): Promise<{ stores: number }> {
  const [owned, shared] = await Promise.all([
    adminDb.collection("stores").where("owner_uid", "==", uid).get(),
    adminDb.collection("stores").where("admin_uids", "array-contains", uid).get(),
  ]);
  for (const store of owned.docs) {
    await store.ref.update({ suspended: true, is_active: false, suspended_reason: "Akun penjual sudah dihapus." });
    await deleteAll((await adminDb.collection("credentials_vault").where("store_id", "==", store.id).get()).docs);
  }
  for (const store of shared.docs) await store.ref.update({ admin_uids: FieldValue.arrayRemove(uid) });
  await adminDb.collection("users").doc(uid).delete();
  await adminDb.collection("customers").doc(uid).delete();
  await adminAuth.deleteUser(uid).catch((err) => {
    if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
  });
  await adminDb.collection("account_deletion_requests").doc(uid).delete();
  return { stores: owned.size };
}
