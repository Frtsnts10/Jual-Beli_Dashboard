import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

async function inBatches(docs: FirebaseFirestore.QueryDocumentSnapshot[], update: Record<string, unknown>) {
  for (let i = 0; i < docs.length; i += 400) {
    const batch = adminDb.batch();
    docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, update));
    await batch.commit();
  }
}

/**
 * Carries out an approved deletion request. Orders stay (sellers need them for records and
 * warranty) but are unlinked from the account; reviews stay as "Pembeli". The login is
 * deleted too unless the same account is also a seller's dashboard login — then only the
 * buyer profile goes, so the seller isn't locked out.
 */
export async function deleteCustomerAccount(uid: string): Promise<{ loginDeleted: boolean }> {
  const [orders, reviews, seller] = await Promise.all([
    adminDb.collection("orders").where("customer_uid", "==", uid).get(),
    adminDb.collection("reviews").where("customer_uid", "==", uid).get(),
    adminDb.collection("users").doc(uid).get(),
  ]);
  await inBatches(orders.docs, { customer_uid: FieldValue.delete() });
  await inBatches(reviews.docs, { customer_uid: null, name: "Pembeli" });
  await adminDb.collection("customers").doc(uid).delete();
  if (!seller.exists) {
    await adminAuth.deleteUser(uid).catch((err) => {
      if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
    });
  }
  await adminDb.collection("account_deletion_requests").doc(uid).delete();
  return { loginDeleted: !seller.exists };
}
