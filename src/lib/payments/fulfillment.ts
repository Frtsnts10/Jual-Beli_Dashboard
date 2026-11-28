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

interface Pick {
  component: DocumentSnapshot;
  credential: DocumentSnapshot;
  /** 1-based slot of a shared entry this sale takes. */
  slot: number;
  slotsTotal: number;
}

/**
 * Reads one AVAILABLE entry (or a free slot of a shared one) per component product, or null if
 * any is out of stock. `exclude` skips entries the order already had (warranty replacement).
 */
async function pickCredentials(tx: Transaction, componentIds: string[], exclude: string[] = []) {
  const picks: Pick[] = [];
  for (const id of componentIds) {
    const [component, available] = await Promise.all([
      tx.get(adminDb.collection("products").doc(id)),
      tx.get(adminDb.collection("credentials_vault").where("product_id", "==", id).where("status", "==", "AVAILABLE").limit(exclude.length + 1)),
    ]);
    const credential = available.docs.find((d) => !exclude.includes(d.id));
    if (!credential) return null;
    const slotsTotal = (credential.get("slots_total") as number | undefined) ?? 1;
    const used = (credential.get("slots_used") as number | undefined) ?? 0;
    picks.push({ component, credential, slot: used + 1, slotsTotal });
  }
  return picks;
}

/** Takes the picked slot: the entry is SOLD once its last slot goes. */
function takeSlot(tx: Transaction, p: Pick, orderId: string, now: Timestamp, expiry: Timestamp) {
  const full = p.slot >= p.slotsTotal;
  tx.update(p.credential.ref, {
    slots_used: FieldValue.increment(1),
    slot_orders: FieldValue.arrayUnion(orderId),
    // A shared entry keeps its own expiry; buyers each get theirs on the order.
    ...(p.slotsTotal > 1 ? {} : { expiry_date: expiry }),
    ...(full ? { status: "SOLD", order_id: orderId, sold_at: now } : {}),
  });
  tx.update(p.component.ref, { stock_available: FieldValue.increment(-1) });
}

const slotMap = (picks: Pick[]) => Object.fromEntries(picks.filter((p) => p.slotsTotal > 1).map((p) => [p.credential.id, p.slot]));

/**
 * Marks an order PAID and allocates its credentials (one per bundle component) in one
 * transaction, so concurrent payments never receive the same account. Idempotent: an order
 * that already has credentials is left alone. A paid order without enough stock is flagged
 * `needs_stock`; calling this again after the seller restocks allocates it.
 */
export async function fulfillOrder(orderId: string): Promise<FulfillResult> {
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
    };
    if (!picks) {
      tx.update(orderRef, { ...paidFields, needs_stock: true });
      return "needs_stock";
    }

    let accessUntil: Timestamp | null = null;
    for (const p of picks) {
      const days = (p.component.get("duration_days") as number | undefined) ?? 30;
      const expiry: Timestamp = p.credential.get("expiry_date") ?? Timestamp.fromMillis(now.toMillis() + days * DAY_MS);
      if (!accessUntil || expiry.toMillis() < accessUntil.toMillis()) accessUntil = expiry;
      takeSlot(tx, p, orderId, now, expiry);
    }
    const ids = picks.map((p) => p.credential.id);
    tx.update(orderRef, {
      ...paidFields,
      credential_id: ids[0],
      credential_ids: ids,
      credential_slots: slotMap(picks),
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

    const oldIds = (order.get("credential_ids") as string[] | undefined) ?? (order.get("credential_id") ? [order.get("credential_id")] : []);
    const product = await tx.get(adminDb.collection("products").doc(order.get("product_id")));
    const olds = await Promise.all(oldIds.map((id) => tx.get(adminDb.collection("credentials_vault").doc(id))));
    const picks = await pickCredentials(tx, componentsOf(product), oldIds);
    if (!picks) return "needs_stock";

    const now = Timestamp.now();
    for (const old of olds) {
      // A shared entry is still used by its other buyers: only a single-buyer entry is retired.
      if (!old.exists || ((old.get("slots_total") as number | undefined) ?? 1) > 1) continue;
      tx.update(old.ref, { status: "EXPIRED", retired_at: now });
    }
    // Replacements inherit the remaining access period of the original sale.
    const expiry: Timestamp = order.get("access_expires_at") ?? now;
    for (const p of picks) takeSlot(tx, p, orderId, now, expiry);
    const ids = picks.map((p) => p.credential.id);
    tx.update(orderRef, {
      credential_id: ids[0],
      credential_ids: ids,
      credential_slots: slotMap(picks),
      warranty_status: "REPLACED",
      delivery_status: "PENDING",
      replacements: FieldValue.arrayUnion({ from: oldIds, to: ids, at: now }),
    });
    return "replaced";
  });
}
