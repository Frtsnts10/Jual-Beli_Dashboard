import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

export type FulfillResult = "fulfilled" | "already_fulfilled" | "needs_stock" | "not_found";

/**
 * Marks an order PAID and allocates one AVAILABLE credential for its product, all in
 * one transaction so two concurrent payments can never receive the same account.
 * Safe to call repeatedly (Xendit retries webhooks): an order that already has a
 * credential is left alone. A paid order with no stock is flagged `needs_stock`; calling
 * this again after the seller restocks allocates it.
 */
export async function fulfillOrder(orderId: string, opts: { invoiceId?: string } = {}): Promise<FulfillResult> {
  const orderRef = adminDb.collection("orders").doc(orderId);

  return adminDb.runTransaction(async (tx) => {
    const order = await tx.get(orderRef);
    if (!order.exists) return "not_found";
    if (order.get("payment_status") === "PAID" && order.get("credential_id")) return "already_fulfilled";

    const productRef = adminDb.collection("products").doc(order.get("product_id"));
    const [product, available] = await Promise.all([
      tx.get(productRef),
      tx.get(
        adminDb
          .collection("credentials_vault")
          .where("product_id", "==", order.get("product_id"))
          .where("status", "==", "AVAILABLE")
          .limit(1)
      ),
    ]);

    const now = Timestamp.now();
    const paidFields = {
      payment_status: "PAID",
      paid_at: order.get("paid_at") ?? now,
      ...(opts.invoiceId ? { xendit_invoice_id: opts.invoiceId } : {}),
    };

    const credential = available.docs[0];
    if (!credential) {
      tx.update(orderRef, { ...paidFields, needs_stock: true });
      return "needs_stock";
    }

    const durationDays = (product.get("duration_days") as number | undefined) ?? 30;
    const expiry: Timestamp =
      credential.get("expiry_date") ?? Timestamp.fromMillis(now.toMillis() + durationDays * DAY_MS);

    tx.update(credential.ref, { status: "SOLD", order_id: orderId, sold_at: now, expiry_date: expiry });
    tx.update(productRef, { stock_available: FieldValue.increment(-1) });
    tx.update(orderRef, {
      ...paidFields,
      credential_id: credential.id,
      needs_stock: false,
      access_expires_at: expiry,
    });
    return "fulfilled";
  });
}

/**
 * One-click warranty replacement: retires the order's current credential and assigns
 * a fresh AVAILABLE one for the same product.
 */
export async function replaceCredential(orderId: string): Promise<"replaced" | "needs_stock" | "not_found" | "not_paid"> {
  const orderRef = adminDb.collection("orders").doc(orderId);

  return adminDb.runTransaction(async (tx) => {
    const order = await tx.get(orderRef);
    if (!order.exists) return "not_found";
    if (order.get("payment_status") !== "PAID") return "not_paid";

    const available = await tx.get(
      adminDb
        .collection("credentials_vault")
        .where("product_id", "==", order.get("product_id"))
        .where("status", "==", "AVAILABLE")
        .limit(1)
    );
    const fresh = available.docs[0];
    if (!fresh) return "needs_stock";

    const now = Timestamp.now();
    const oldId = order.get("credential_id") as string | null;
    if (oldId) {
      tx.update(adminDb.collection("credentials_vault").doc(oldId), { status: "EXPIRED", retired_at: now });
    }
    // The replacement inherits the remaining access period of the original sale.
    const expiry: Timestamp = order.get("access_expires_at") ?? fresh.get("expiry_date") ?? now;
    tx.update(fresh.ref, { status: "SOLD", order_id: orderId, sold_at: now, expiry_date: expiry });
    tx.update(adminDb.collection("products").doc(order.get("product_id")), { stock_available: FieldValue.increment(-1) });
    tx.update(orderRef, {
      credential_id: fresh.id,
      warranty_status: "REPLACED",
      delivery_status: "PENDING",
      replacements: FieldValue.arrayUnion({ from: oldId, to: fresh.id, at: now }),
    });
    return "replaced";
  });
}
