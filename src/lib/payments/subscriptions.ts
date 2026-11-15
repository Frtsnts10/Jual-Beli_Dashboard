import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Activates a paid plan purchase once a platform admin has seen the money in the platform's
 * QRIS mutations. Renewing the same plan before it lapses extends from the current expiry;
 * anything else (new plan, lapsed plan) starts today. Idempotent.
 */
export async function applySubscriptionPayment(paymentId: string) {
  const paymentRef = adminDb.collection("subscription_payments").doc(paymentId);
  return adminDb.runTransaction(async (tx) => {
    const payment = await tx.get(paymentRef);
    if (!payment.exists) return "not_found" as const;
    if (payment.get("status") === "PAID") return "already_paid" as const;

    const userRef = adminDb.collection("users").doc(payment.get("uid"));
    const user = await tx.get(userRef);
    const now = Date.now();
    const currentExpiry = (user.get("subscription_expiry") as Timestamp | null)?.toMillis() ?? 0;
    const sameTierActive = user.get("subscription_tier") === payment.get("tier") && currentExpiry > now;
    const days = payment.get("period") === "yearly" ? 365 : 30;
    const start = sameTierActive ? currentExpiry : now;

    tx.update(userRef, {
      subscription_tier: payment.get("tier"),
      subscription_expiry: Timestamp.fromMillis(start + days * DAY_MS),
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
