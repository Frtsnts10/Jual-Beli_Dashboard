import "server-only";
import { FieldValue, Timestamp, type DocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

export type FulfillResult = "fulfilled" | "already_fulfilled" | "needs_stock" | "not_found";

/** A bundle is fulfilled with one credential per component; a normal product is its own single component. */
function componentsOf(product: DocumentSnapshot): string[] {
  const items = product.get("bundle_items") as string[] | null | undefined;
  return items?.length ? items : [product.id];
}

/** Reads one AVAILABLE credential per component product, or null if any is out of stock. */
async function pickCredentials(tx: Transaction, componentIds: string[]) {
  const picks: { component: DocumentSnapshot; credential: DocumentSnapshot }[] = [];
  for (const id of componentIds) {
    const [component, available] = await Promise.all([
      tx.get(adminDb.collection("products").doc(id)),
      tx.get(adminDb.collection("credentials_vault").where("product_id", "==", id).where("status", "==", "AVAILABLE").limit(1)),
    ]);
    if (!available.docs[0]) return null;
    picks.push({ component, credential: available.docs[0] });
  }
  return picks;
}

/**
 * Marks an order PAID and allocates its credentials (one per bundle component) in one
 * transaction, so concurrent payments never receive the same account. Idempotent: an order
 * that already has credentials is left alone. A paid order without enough stock is flagged
 * `needs_stock`; calling this again after the seller restocks allocates it.
 */
export async function fulfillOrder(orderId: string, opts: { invoiceId?: string } = {}): Promise<FulfillResult> {
  const orderRef = adminDb.collection("orders").doc(orderId);

  return adminDb.runTransaction(async (tx) => {
    const order = await tx.get(orderRef);
    if (!order.exists) return "not_found";
    if (order.get("payment_status") === "PAID" && order.get("credential_id")) return "already_fulfilled";

    const product = await tx.get(adminDb.collection("products").doc(order.get("product_id")));
    const picks = await pickCredentials(tx, componentsOf(product));

    const now = Timestamp.now();
    const paidFields = {
      payment_status: "PAID",
      paid_at: order.get("paid_at") ?? now,
      ...(opts.invoiceId ? { xendit_invoice_id: opts.invoiceId } : {}),
    };
    if (!picks) {
      tx.update(orderRef, { ...paidFields, needs_stock: true });
      return "needs_stock";
    }

    let accessUntil: Timestamp | null = null;
    for (const { component, credential } of picks) {
      const days = (component.get("duration_days") as number | undefined) ?? 30;
      const expiry: Timestamp = credential.get("expiry_date") ?? Timestamp.fromMillis(now.toMillis() + days * DAY_MS);
      if (!accessUntil || expiry.toMillis() < accessUntil.toMillis()) accessUntil = expiry;
      tx.update(credential.ref, { status: "SOLD", order_id: orderId, sold_at: now, expiry_date: expiry });
      tx.update(component.ref, { stock_available: FieldValue.increment(-1) });
    }
    const ids = picks.map((p) => p.credential.id);
    tx.update(orderRef, {
      ...paidFields,
      credential_id: ids[0],
      credential_ids: ids,
      needs_stock: false,
      // For a bundle, the order is "active" until its first account expires.
      access_expires_at: accessUntil,
    });
    return "fulfilled";
  });
}

/**
 * One-click warranty replacement: retires every credential on the order and assigns fresh
 * AVAILABLE ones (one per bundle component).
 */
export async function replaceCredential(orderId: string): Promise<"replaced" | "needs_stock" | "not_found" | "not_paid"> {
  const orderRef = adminDb.collection("orders").doc(orderId);

  return adminDb.runTransaction(async (tx) => {
    const order = await tx.get(orderRef);
    if (!order.exists) return "not_found";
    if (order.get("payment_status") !== "PAID") return "not_paid";

    const product = await tx.get(adminDb.collection("products").doc(order.get("product_id")));
    const picks = await pickCredentials(tx, componentsOf(product));
    if (!picks) return "needs_stock";

    const now = Timestamp.now();
    const oldIds = (order.get("credential_ids") as string[] | undefined) ?? (order.get("credential_id") ? [order.get("credential_id")] : []);
    for (const id of oldIds) {
      tx.update(adminDb.collection("credentials_vault").doc(id), { status: "EXPIRED", retired_at: now });
    }
    // Replacements inherit the remaining access period of the original sale.
    const expiry: Timestamp = order.get("access_expires_at") ?? now;
    for (const { component, credential } of picks) {
      tx.update(credential.ref, { status: "SOLD", order_id: orderId, sold_at: now, expiry_date: expiry });
      tx.update(component.ref, { stock_available: FieldValue.increment(-1) });
    }
    const ids = picks.map((p) => p.credential.id);
    tx.update(orderRef, {
      credential_id: ids[0],
      credential_ids: ids,
      warranty_status: "REPLACED",
      delivery_status: "PENDING",
      replacements: FieldValue.arrayUnion({ from: oldIds, to: ids, at: now }),
    });
    return "replaced";
  });
}
