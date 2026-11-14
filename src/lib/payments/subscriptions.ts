import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Activates a paid plan purchase. Renewing the same plan before it lapses extends from
 * the current expiry; anything else (new plan, lapsed plan) starts today. Idempotent.
 */
export async function applySubscriptionPayment(paymentId: string, invoiceId: string, paidAmount: number) {
  const paymentRef = adminDb.collection("subscription_payments").doc(paymentId);
  return adminDb.runTransaction(async (tx) => {
    const payment = await tx.get(paymentRef);
    if (!payment.exists) return "not_found" as const;
    if (payment.get("status") === "PAID") return "already_paid" as const;
    if (payment.get("xendit_invoice_id") && payment.get("xendit_invoice_id") !== invoiceId) return "invoice_mismatch" as const;
    if (payment.get("amount") !== paidAmount) return "amount_mismatch" as const;

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
    tx.update(paymentRef, { status: "PAID", paid_at: Timestamp.now(), xendit_invoice_id: invoiceId });
    return "activated" as const;
  });
}
