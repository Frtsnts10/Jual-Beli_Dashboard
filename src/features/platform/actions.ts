"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requirePlatformAdmin } from "@/lib/access/platform";
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

/**
 * Records that the platform transferred a seller's balance for orders it collected
 * (settlement PLATFORM: seller had no LIVE Xendit sub-account). Marks exactly the orders
 * that were owed when the admin opened the page, so newer sales stay owed.
 */
export async function markPayoutDone(storeId: string, orderIds: string[], reference: string): Promise<ActionResult<{ amount: number }>> {
  const admin = await requirePlatformAdmin();
  if (orderIds.length === 0) return fail("Tidak ada pesanan.");
  if (reference.trim().length < 3) return fail("Isi referensi transfer (mis. nomor bukti transfer).");

  const refs = orderIds.map((id) => adminDb.collection("orders").doc(id));
  const amount = await adminDb.runTransaction(async (tx) => {
    const snaps = await tx.getAll(...refs);
    let total = 0;
    for (const s of snaps) {
      if (!s.exists || s.get("store_id") !== storeId || s.get("settlement") !== "PLATFORM" || s.get("payment_status") !== "PAID" || s.get("payout_status") === "PAID_OUT") {
        throw new Error(`Order ${s.id} is not an owed payout for this store`);
      }
      total += (s.get("amount") as number) - ((s.get("platform_fee") as number) ?? 0);
      tx.update(s.ref, { payout_status: "PAID_OUT", payout_reference: reference.trim(), payout_at: FieldValue.serverTimestamp() });
    }
    return total;
  }).catch((err: Error) => err);
  if (amount instanceof Error) return fail("Daftar pesanan berubah. Muat ulang halaman lalu coba lagi.");

  await audit("payout.mark_paid", storeId, admin.email, { orderIds, amount, reference });
  revalidatePath("/platform", "layout");
  return { ok: true, data: { amount } };
}
