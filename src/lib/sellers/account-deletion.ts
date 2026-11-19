import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminBucket, adminDb } from "@/lib/firebase/admin";
import { removeDomain, vercelDomainsEnabled } from "@/lib/integrations/vercel-domains";

async function deleteQuery(q: FirebaseFirestore.Query) {
  for (;;) {
    const snap = await q.limit(400).get();
    if (snap.empty) return;
    const batch = adminDb.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < 400) return;
  }
}

/** Everything a store owns: catalogue, stock, sales history, buyers' proofs, marketing, images. */
async function wipeStore(store: FirebaseFirestore.DocumentSnapshot) {
  const id = store.id;
  const orders = await adminDb.collection("orders").where("store_id", "==", id).select().get();
  for (let i = 0; i < orders.size; i += 400) {
    const batch = adminDb.batch();
    orders.docs.slice(i, i + 400).forEach((o) => batch.delete(adminDb.collection("payment_proofs").doc(o.id)));
    await batch.commit();
  }
  for (const name of ["orders", "products", "credentials_vault", "vouchers", "reviews", "restock_requests", "broadcasts", "store_invites"]) {
    await deleteQuery(adminDb.collection(name).where("store_id", "==", id));
  }
  const slug = store.get("slug") as string | undefined;
  const domain = store.get("custom_domain") as string | undefined;
  if (slug) await adminDb.collection("store_slugs").doc(slug).delete();
  if (domain) {
    await adminDb.collection("store_domains").doc(domain).delete();
    if (vercelDomainsEnabled()) await removeDomain(domain).catch(() => {});
  }
  await adminBucket.deleteFiles({ prefix: `stores/${id}/` }).catch(() => {});
  // The store document and its subcollections (members, private integrations).
  await adminDb.recursiveDelete(store.ref);
}

/**
 * Deletes a seller account for good: every store they own with all of its data (products,
 * stock vault, orders and sales history, buyers' payment proofs, vouchers, reviews, images),
 * their plan payments, help-desk threads, notifications and the login itself. They are also
 * removed from stores they were an admin of. There is no undo.
 */
export async function deleteSellerAccount(uid: string): Promise<{ stores: number }> {
  const [owned, shared] = await Promise.all([
    adminDb.collection("stores").where("owner_uid", "==", uid).get(),
    adminDb.collection("stores").where("admin_uids", "array-contains", uid).get(),
  ]);
  for (const store of owned.docs) await wipeStore(store);
  for (const store of shared.docs) {
    await store.ref.update({ admin_uids: FieldValue.arrayRemove(uid) });
    await store.ref.collection("members").doc(uid).delete();
  }
  const tickets = await adminDb.collection("support_tickets").where("uid", "==", uid).get();
  for (const t of tickets.docs) await adminDb.recursiveDelete(t.ref);
  for (const name of ["subscription_payments", "notifications", "push_tokens"]) await deleteQuery(adminDb.collection(name).where("uid", "==", uid));
  await adminBucket.deleteFiles({ prefix: `support/${uid}/` }).catch(() => {});
  await adminDb.collection("customers").doc(uid).delete();
  await adminDb.collection("account_deletion_requests").doc(uid).delete();
  await adminDb.collection("users").doc(uid).delete();
  await adminAuth.deleteUser(uid).catch((err) => {
    if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
  });
  return { stores: owned.size };
}
