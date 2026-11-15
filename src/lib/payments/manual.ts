import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

// Store orders are paid straight to the seller's own QRIS. The platform never sees the money,
// so the seller confirms each payment from the buyer's uploaded proof (or rejects it).

/**
 * PENDING → FAILED, giving the order's voucher use back. One transaction, so a double click
 * or a concurrent expiry can't release twice. Returns false if the order was no longer pending.
 */
export async function failOrder(orderId: string, reason: string | null): Promise<boolean> {
  const orderRef = adminDb.collection("orders").doc(orderId);
  return adminDb.runTransaction(async (tx) => {
    const order = await tx.get(orderRef);
    if (!order.exists || order.get("payment_status") !== "PENDING") return false;
    const code = order.get("voucher_code") as string | null;
    const voucherRef = code ? adminDb.collection("vouchers").doc(`${order.get("store_id")}_${code}`) : null;
    const voucher = voucherRef ? await tx.get(voucherRef) : null;
    tx.update(orderRef, { payment_status: "FAILED", rejected_reason: reason, failed_at: FieldValue.serverTimestamp() });
    if (voucherRef && voucher?.exists && (voucher.get("used_count") ?? 0) > 0) tx.update(voucherRef, { used_count: FieldValue.increment(-1) });
    return true;
  });
}

/**
 * Unpaid orders whose pay-by time passed without a proof fail (and free their voucher use).
 * Orders with a proof never expire on their own: the seller decides. Run lazily when the
 * seller opens Pesanan, and daily by cron for every store.
 */
export async function expireUnpaidOrders(storeId?: string): Promise<number> {
  let q = adminDb.collection("orders").where("payment_status", "==", "PENDING").where("pay_by", "<", Timestamp.now());
  if (storeId) q = q.where("store_id", "==", storeId);
  const snap = await q.limit(300).get();
  let n = 0;
  for (const d of snap.docs) {
    if (d.get("proof_uploaded_at")) continue;
    if (await failOrder(d.id, "Tidak dibayar sebelum batas waktu")) n++;
  }
  return n;
}
