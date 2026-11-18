import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { effectiveTier, toISO } from "@/lib/data/mappers";
import { newExpiry } from "@/lib/billing/plan-change";
import { getCatalog } from "@/lib/catalog";
import type { SubscriptionTier } from "@/types/schema";

/**
 * Activates a paid plan purchase once a platform admin has seen the money in the platform's
 * QRIS mutations. Renewing the same plan extends it; switching up or down starts today and
 * converts what's left of the current plan into bonus days (lib/billing/plan-change.ts).
 * Idempotent.
 */
export async function applySubscriptionPayment(paymentId: string) {
  const paymentRef = adminDb.collection("subscription_payments").doc(paymentId);
  const { plans } = await getCatalog();
  const prices = { starter: plans.starter.priceMonthly, pro: plans.pro.priceMonthly, ultimate: plans.ultimate.priceMonthly };
  return adminDb.runTransaction(async (tx) => {
    const payment = await tx.get(paymentRef);
    if (!payment.exists) return "not_found" as const;
    if (payment.get("status") === "PAID") return "already_paid" as const;

    const userRef = adminDb.collection("users").doc(payment.get("uid"));
    const user = await tx.get(userRef);
    const current = effectiveTier(user.get("subscription_tier"), user.get("subscription_expiry"));
    const expiry = toISO(user.get("subscription_expiry"));
    const days = payment.get("period") === "yearly" ? 365 : 30;

    tx.update(userRef, {
      subscription_tier: payment.get("tier"),
      subscription_expiry: Timestamp.fromMillis(newExpiry(current, expiry, payment.get("tier") as SubscriptionTier, days, Date.now(), prices)),
    });
    tx.update(paymentRef, { status: "PAID", paid_at: Timestamp.now(), rejected_reason: null });
    return "activated" as const;
  });
}

/** The transfer isn't in the platform's mutations: the purchase is rejected (the plan is untouched). */
export async function rejectSubscriptionPayment(paymentId: string, reason: string) {
  const ref = adminDb.collection("subscription_payments").doc(paymentId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get("status") !== "PENDING") return false;
    tx.update(ref, { status: "REJECTED", rejected_reason: reason });
    return true;
  });
}

/** A seller's pending purchases with no proof by their pay-by time expire (lazily, on the billing page). */
export async function expireSubscriptionPayments(uid: string) {
  const snap = await adminDb.collection("subscription_payments").where("uid", "==", uid).where("status", "==", "PENDING").get();
  const now = Date.now();
  const stale = snap.docs.filter((d) => !d.get("proof_uploaded_at") && (d.get("pay_by")?.toMillis?.() ?? 0) < now);
  await Promise.all(stale.map((d) => d.ref.update({ status: "EXPIRED" })));
}
