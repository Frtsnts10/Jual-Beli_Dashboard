"use server";

import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";

export interface StorePulse {
  orders: number;
  paid: number;
  awaiting: number;
  failed: number;
  claims: number;
}

/**
 * A cheap fingerprint of the store's orders (five count queries). The dashboard polls it and
 * re-renders when it changes: a new order, a buyer's payment proof, a confirmation or a claim.
 */
export async function storePulse(storeId: string): Promise<StorePulse> {
  await requireStore(storeId);
  const orders = adminDb.collection("orders").where("store_id", "==", storeId);
  const count = async (q: FirebaseFirestore.Query) => (await q.count().get()).data().count;
  const [all, paid, awaiting, failed, claims] = await Promise.all([
    count(orders),
    count(orders.where("payment_status", "==", "PAID")),
    count(orders.where("payment_status", "==", "PENDING").where("proof_uploaded_at", "!=", null)),
    count(orders.where("payment_status", "==", "FAILED")),
    count(orders.where("warranty_status", "==", "CLAIMED")),
  ]);
  return { orders: all, paid, awaiting, failed, claims };
}
