"use server";

import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { requirePlatformAdmin } from "@/lib/access/platform";

export interface StorePulse {
  orders: number;
  paid: number;
  awaiting: number;
  failed: number;
  claims: number;
  /** Bell notifications for this user (announcements, ticket replies, …). */
  notes: number;
  /** Announcements still showing as a banner. */
  banners: number;
}

/**
 * A cheap fingerprint of the store's orders and the seller's notifications (count queries). The dashboard polls it and
 * re-renders when it changes: a new order, a buyer's payment proof, a confirmation, a claim,
 * a new announcement or notification.
 */
/**
 * A count for the live fingerprint. A failing query (e.g. a composite index still building) gives -1 instead of
 * failing the whole poll — the page then refreshes on the other signals rather than erroring every few seconds.
 */
async function safeCount(q: FirebaseFirestore.Query): Promise<number> {
  try {
    return (await q.count().get()).data().count;
  } catch (err) {
    console.error("live pulse count failed", err);
    return -1;
  }
}

export async function storePulse(storeId: string): Promise<StorePulse> {
  const { user } = await requireStore(storeId);
  const orders = adminDb.collection("orders").where("store_id", "==", storeId);
  const count = safeCount;
  const [all, paid, awaiting, failed, claims, notes, banners] = await Promise.all([
    count(orders),
    count(orders.where("payment_status", "==", "PAID")),
    count(orders.where("payment_status", "==", "PENDING").where("proof_uploaded_at", "!=", null)),
    count(orders.where("payment_status", "==", "FAILED")),
    count(orders.where("warranty_status", "==", "CLAIMED")),
    count(adminDb.collection("notifications").where("uid", "==", user.uid)),
    count(adminDb.collection("announcements").where("active", "==", true)),
  ]);
  return { orders: all, paid, awaiting, failed, claims, notes, banners };
}

export interface PlatformPulse {
  proofs: number;
  tickets: number;
  deletions: number;
  stores: number;
  users: number;
  notes: number;
  /** All store orders and the paid ones (Ringkasan: GMV, charts, top stores). */
  orders: number;
  paidOrders: number;
  /** Plan payments and the confirmed ones (Ringkasan: plan revenue, latest payments). */
  planPayments: number;
  paidPlans: number;
  banners: number;
}

/**
 * Fingerprint of everything the admin pages show: plan payment proofs, help desk, deletions,
 * sign-ups, platform orders and plan revenue (count queries only).
 */
export async function platformPulse(): Promise<PlatformPulse> {
  const admin = await requirePlatformAdmin();
  const count = safeCount;
  const [proofs, tickets, deletions, stores, users, notes, orders, paidOrders, planPayments, paidPlans, banners] = await Promise.all([
    count(adminDb.collection("subscription_payments").where("status", "==", "PENDING").where("proof_uploaded_at", "!=", null)),
    count(adminDb.collection("support_tickets").where("unread_by_admin", "==", true)),
    count(adminDb.collection("account_deletion_requests").where("status", "==", "PENDING")),
    count(adminDb.collection("stores")),
    count(adminDb.collection("users")),
    count(adminDb.collection("notifications").where("uid", "==", admin.uid)),
    count(adminDb.collection("orders")),
    count(adminDb.collection("orders").where("payment_status", "==", "PAID")),
    count(adminDb.collection("subscription_payments")),
    count(adminDb.collection("subscription_payments").where("status", "==", "PAID")),
    count(adminDb.collection("announcements").where("active", "==", true)),
  ]);
  return { proofs, tickets, deletions, stores, users, notes, orders, paidOrders, planPayments, paidPlans, banners };
}
