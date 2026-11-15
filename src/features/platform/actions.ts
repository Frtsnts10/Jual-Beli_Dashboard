"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requirePlatformAdmin } from "@/lib/access/platform";
import { inspectQris } from "@/lib/qris";
import { applySubscriptionPayment, rejectSubscriptionPayment } from "@/lib/payments/subscriptions";
import { fail, type ActionResult } from "@/lib/action-result";
import type { SubscriptionTier } from "@/types/schema";

async function audit(action: string, target: string, by: string, details: Record<string, unknown> = {}) {
  await adminDb.collection("platform_audit").add({ action, target, by, details, at: FieldValue.serverTimestamp() });
}

export async function setStoreSuspended(storeId: string, suspended: boolean, reason: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (suspended && reason.trim().length < 5) return fail("Tulis alasan suspend (min. 5 karakter).");
  const ref = adminDb.collection("stores").doc(storeId);
  if (!(await ref.get()).exists) return fail("Toko tidak ditemukan.");
  await ref.update({ suspended, suspended_reason: suspended ? reason.trim() : null });
  await audit(suspended ? "store.suspend" : "store.unsuspend", storeId, admin.email, { reason });
  revalidatePath("/platform", "layout");
  return { ok: true };
}

/** Grants or changes a plan by hand (comped accounts, refunds, manual payments). */
export async function setUserPlan(uid: string, tier: SubscriptionTier, days: number): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!["starter", "pro", "ultimate"].includes(tier)) return fail("Paket tidak dikenal.");
  if (tier !== "starter" && (!Number.isInteger(days) || days < 1 || days > 3650)) return fail("Durasi 1–3650 hari.");
  const ref = adminDb.collection("users").doc(uid);
  if (!(await ref.get()).exists) return fail("Pengguna tidak ditemukan.");
  await ref.update({
    subscription_tier: tier,
    subscription_expiry: tier === "starter" ? null : Timestamp.fromMillis(Date.now() + days * 86_400_000),
  });
  await audit("user.set_plan", uid, admin.email, { tier, days });
  revalidatePath("/platform", "layout");
  return { ok: true };
}


/** The platform's own QRIS, used for plan purchases (sellers pay it and upload a proof). */
export async function savePlatformQris(payload: string): Promise<ActionResult<{ merchant: string }>> {
  const admin = await requirePlatformAdmin();
  const qris = payload.trim();
  const info = inspectQris(qris);
  if (!info.ok) return fail(info.error);
  await adminDb
    .collection("platform")
    .doc("settings")
    .set({ qris: { qris_payload: qris, merchant_name: info.merchant, nmid: info.nmid, updated_at: FieldValue.serverTimestamp() } }, { merge: true });
  await audit("platform.qris_set", "platform", admin.email, { merchant: info.merchant, nmid: info.nmid });
  revalidatePath("/platform", "layout");
  return { ok: true, data: { merchant: info.merchant } };
}

export async function removePlatformQris(): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  await adminDb.collection("platform").doc("settings").set({ qris: null }, { merge: true });
  await audit("platform.qris_removed", "platform", admin.email);
  revalidatePath("/platform", "layout");
  return { ok: true };
}

/** Plan purchase proof, for the admin's review dialog. */
export async function getSubscriptionProof(paymentId: string): Promise<ActionResult<{ image: string; uploadedAt: string | null }>> {
  await requirePlatformAdmin();
  const proof = await adminDb.collection("payment_proofs").doc(paymentId).get();
  if (!proof.exists || !paymentId.startsWith("SUB-")) return fail("Belum ada bukti pembayaran.");
  return { ok: true, data: { image: proof.get("image") as string, uploadedAt: proof.get("uploaded_at")?.toDate?.().toISOString() ?? null } };
}

export async function confirmSubscriptionPayment(paymentId: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const result = await applySubscriptionPayment(paymentId);
  if (result === "not_found") return fail("Pembayaran tidak ditemukan.");
  await audit("subscription.confirm", paymentId, admin.email, { result });
  revalidatePath("/platform", "layout");
  return { ok: true };
}

export async function rejectSubscription(paymentId: string, reason: string): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const why = reason.trim().slice(0, 200);
  if (why.length < 3) return fail("Tulis alasan singkat.");
  if (!(await rejectSubscriptionPayment(paymentId, why))) return fail("Pembayaran ini sudah tidak menunggu konfirmasi.");
  await audit("subscription.reject", paymentId, admin.email, { reason: why });
  revalidatePath("/platform", "layout");
  return { ok: true };
}
