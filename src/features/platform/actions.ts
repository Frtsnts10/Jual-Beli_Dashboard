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

