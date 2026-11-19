"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requirePlatformAdmin } from "@/lib/access/platform";
import { freshlyVerified } from "@/lib/access/reauth";
import { resetPlatformData, type ResetSummary } from "@/lib/platform/reset";
import { fail, type ActionResult } from "@/lib/action-result";

const RESET_PHRASE = "RESET SEMUA DATA";

/**
 * Admin → Ringkasan → Reset data: wipes every seller, store, buyer, order and file; keeps the
 * platform admins, platform settings and the audit log (lib/platform/reset.ts). Requires the
 * admin's password (or Google) again and the phrase.
 */
export async function resetAllData(input: { phrase: string; idToken: string }): Promise<ActionResult<ResetSummary>> {
  const admin = await requirePlatformAdmin();
  if (input.phrase.trim() !== RESET_PHRASE) return fail(`Ketik persis: ${RESET_PHRASE}`);
  const check = await freshlyVerified(input.idToken, admin.uid);
  if (check === "invalid") return fail("Verifikasi gagal. Masukkan password akun admin ini.");
  if (check === "stale") return fail("Verifikasi kedaluwarsa. Ulangi.");
  const summary = await resetPlatformData();
  await adminDb.collection("platform_audit").add({ action: "platform.reset", target: "all", by: admin.email, details: summary, at: FieldValue.serverTimestamp() });
  revalidatePath("/", "layout");
  return { ok: true, data: summary };
}
