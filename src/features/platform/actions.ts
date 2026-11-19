"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requirePlatformAdmin } from "@/lib/access/platform";
import { inspectQris } from "@/lib/qris";
import {
  applySubscriptionPayment,
  rejectSubscriptionPayment,
} from "@/lib/payments/subscriptions";
import { deleteCustomerAccount } from "@/lib/customers/account-deletion";
import { deleteSellerAccount } from "@/lib/sellers/account-deletion";
import { fail, type ActionResult } from "@/lib/action-result";
import type { SubscriptionTier } from "@/types/schema";
import { getCatalog } from "@/lib/catalog";
import { notify } from "@/lib/notify";

async function audit(
  action: string,
  target: string,
  by: string,
  details: Record<string, unknown> = {},
) {
  await adminDb
    .collection("platform_audit")
    .add({ action, target, by, details, at: FieldValue.serverTimestamp() });
}

export async function setStoreSuspended(
  storeId: string,
  suspended: boolean,
  reason: string,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (suspended && reason.trim().length < 5)
    return fail("Tulis alasan suspend (min. 5 karakter).");
  const ref = adminDb.collection("stores").doc(storeId);
  if (!(await ref.get()).exists) return fail("Toko tidak ditemukan.");
  await ref.update({
    suspended,
    suspended_reason: suspended ? reason.trim() : null,
  });
  await audit(
    suspended ? "store.suspend" : "store.unsuspend",
    storeId,
    admin.email,
    { reason },
  );
  revalidatePath("/platform", "layout");
  return { ok: true };
}

/** Grants or changes a plan by hand (comped accounts, refunds, manual payments). */
export async function setUserPlan(
  uid: string,
  tier: SubscriptionTier,
  days: number,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!(await getCatalog()).plans[tier]) return fail("Paket tidak dikenal.");
  if (
    tier !== "starter" &&
    (!Number.isInteger(days) || days < 1 || days > 3650)
  )
    return fail("Durasi 1–3650 hari.");
  const ref = adminDb.collection("users").doc(uid);
  if (!(await ref.get()).exists) return fail("Pengguna tidak ditemukan.");
  await ref.update({
    subscription_tier: tier,
    subscription_expiry:
      tier === "starter"
        ? null
        : Timestamp.fromMillis(Date.now() + days * 86_400_000),
  });
  await audit("user.set_plan", uid, admin.email, { tier, days });
  revalidatePath("/platform", "layout");
  return { ok: true };
}

/** The platform's own QRIS, used for plan purchases (sellers pay it and upload a proof). */
export async function savePlatformQris(
  payload: string,
): Promise<ActionResult<{ merchant: string }>> {
  const admin = await requirePlatformAdmin();
  const qris = payload.trim();
  const info = inspectQris(qris);
  if (!info.ok) return fail(info.error);
  await adminDb
    .collection("platform")
    .doc("settings")
    .set(
      {
        qris: {
          qris_payload: qris,
          merchant_name: info.merchant,
          nmid: info.nmid,
          updated_at: FieldValue.serverTimestamp(),
        },
      },
      { merge: true },
    );
  await audit("platform.qris_set", "platform", admin.email, {
    merchant: info.merchant,
    nmid: info.nmid,
  });
  revalidatePath("/platform", "layout");
  return { ok: true, data: { merchant: info.merchant } };
}

export async function removePlatformQris(): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  await adminDb
    .collection("platform")
    .doc("settings")
    .set({ qris: null }, { merge: true });
  await audit("platform.qris_removed", "platform", admin.email);
  revalidatePath("/platform", "layout");
  return { ok: true };
}

/** Plan purchase proof, for the admin's review dialog. */
export async function getSubscriptionProof(
  paymentId: string,
): Promise<ActionResult<{ image: string; uploadedAt: string | null }>> {
  await requirePlatformAdmin();
  const proof = await adminDb.collection("payment_proofs").doc(paymentId).get();
  if (!proof.exists || !paymentId.startsWith("SUB-"))
    return fail("Belum ada bukti pembayaran.");
  return {
    ok: true,
    data: {
      image: proof.get("image") as string,
      uploadedAt: proof.get("uploaded_at")?.toDate?.().toISOString() ?? null,
    },
  };
}

/** Tells the plan buyer what happened to their payment (bell + push). */
async function notifyBuyer(
  paymentId: string,
  type: string,
  text: (p: FirebaseFirestore.DocumentData) => [string, string],
) {
  const p = (
    await adminDb.collection("subscription_payments").doc(paymentId).get()
  ).data();
  if (!p) return;
  const [title, body] = text(p);
  await notify([p.uid], {
    type,
    title,
    body,
    href: p.store_id ? `/${p.store_id}/billing` : "/dashboard",
  });
}

export async function confirmSubscriptionPayment(
  paymentId: string,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const result = await applySubscriptionPayment(paymentId);
  if (result === "not_found") return fail("Pembayaran tidak ditemukan.");
  await audit("subscription.confirm", paymentId, admin.email, { result });
  const { plans } = await getCatalog();
  if (result === "activated")
    await notifyBuyer(paymentId, "subscription_paid", (p) => [
      `Paket ${plans[p.tier as SubscriptionTier]?.name ?? p.tier} aktif`,
      "Pembayaran Anda dikonfirmasi. Terima kasih!",
    ]);
  revalidatePath("/platform", "layout");
  return { ok: true };
}

export async function rejectSubscription(
  paymentId: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const why = reason.trim().slice(0, 200);
  if (why.length < 3) return fail("Tulis alasan singkat.");
  if (!(await rejectSubscriptionPayment(paymentId, why)))
    return fail("Pembayaran ini sudah tidak menunggu konfirmasi.");
  await audit("subscription.reject", paymentId, admin.email, { reason: why });
  await notifyBuyer(paymentId, "subscription_rejected", () => [
    "Pembayaran paket ditolak",
    `Alasan: ${why}`,
  ]);
  revalidatePath("/platform", "layout");
  return { ok: true };
}

/** Approves a buyer's deletion request: deletes their login + profile (see deleteCustomerAccount). */
export async function approveAccountDeletion(
  uid: string,
): Promise<ActionResult<{ loginDeleted: boolean }>> {
  const admin = await requirePlatformAdmin();
  const ref = adminDb.collection("account_deletion_requests").doc(uid);
  const req = await ref.get();
  if (!req.exists || req.get("status") !== "PENDING")
    return fail("Pengajuan tidak ditemukan atau sudah diproses.");
  if (req.get("kind") === "seller") {
    const { stores } = await deleteSellerAccount(uid);
    // The audit keeps the uid only — the point of the request is that the email goes.
    await audit("seller.delete", uid, admin.email, { stores });
    revalidatePath("/platform", "layout");
    return { ok: true, data: { loginDeleted: true } };
  }
  const res = await deleteCustomerAccount(uid);
  // The audit keeps the uid only — the point of the request is that the email goes.
  await audit("customer.delete", uid, admin.email, {
    loginDeleted: res.loginDeleted,
  });
  revalidatePath("/platform", "layout");
  return { ok: true, data: res };
}

export async function rejectAccountDeletion(
  uid: string,
  reason: string,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const why = reason.trim().slice(0, 300);
  if (why.length < 5)
    return fail(
      "Tulis alasan penolakan (min. 5 karakter) — pembeli akan melihatnya.",
    );
  const ref = adminDb.collection("account_deletion_requests").doc(uid);
  const req = await ref.get();
  if (!req.exists || req.get("status") !== "PENDING")
    return fail("Pengajuan tidak ditemukan atau sudah diproses.");
  await ref.update({
    status: "REJECTED",
    rejected_reason: why,
    reviewed_at: FieldValue.serverTimestamp(),
  });
  await audit("customer.delete_rejected", uid, admin.email, { reason: why });
  if (req.get("kind") === "seller")
    await notify([uid], { type: "deletion_rejected", title: "Pengajuan hapus akun ditolak", body: `Alasan: ${why}`, href: "/dashboard" });
  revalidatePath("/platform", "layout");
  return { ok: true };
}
