"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { freshlyVerified } from "@/lib/access/reauth";
import { requireUser } from "@/lib/access/auth";
import { isPlatformAdmin } from "@/lib/access/platform";
import { notify, platformAdminUids } from "@/lib/notify";
import { fail, type ActionResult } from "@/lib/action-result";

const DELETE_PHRASE = "HAPUS AKUN SAYA";

/**
 * Seller: ask the platform to delete my account and everything in it. Requires re-entering the
 * password (or Google sign-in) on the form — `idToken` comes from that fresh sign-in — plus the
 * account email and the confirmation phrase. A platform admin approves it in Admin → Hapus akun,
 * which runs lib/sellers/account-deletion.ts; until then the seller can withdraw it.
 */
export async function requestMyAccountDeletion(input: { email: string; phrase: string; idToken: string; reason: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (await isPlatformAdmin()) return fail("Akun admin platform tidak bisa dihapus dari sini.");
  const check = await freshlyVerified(input.idToken, user.uid);
  if (check === "invalid") return fail("Verifikasi gagal. Masukkan password akun ini (atau masuk dengan Google akun ini).");
  if (check === "stale") return fail("Verifikasi kedaluwarsa. Ulangi.");
  if (input.email.trim().toLowerCase() !== user.email.toLowerCase()) return fail("Email tidak sama dengan email akun ini.");
  if (input.phrase.trim() !== DELETE_PHRASE) return fail(`Ketik persis: ${DELETE_PHRASE}`);

  const ref = adminDb.collection("account_deletion_requests").doc(user.uid);
  const current = await ref.get();
  if (current.get("status") === "PENDING" && current.get("kind") === "seller") return { ok: true };
  await ref.set({
    uid: user.uid,
    kind: "seller",
    email: user.email,
    name: user.full_name ?? "",
    reason: input.reason.trim().slice(0, 500),
    store_id: null,
    status: "PENDING",
    requested_at: FieldValue.serverTimestamp(),
    reviewed_at: null,
    rejected_reason: null,
  });
  await notify(await platformAdminUids(), {
    type: "deletion_request",
    title: "Pengajuan hapus akun penjual",
    body: user.email,
    href: "/platform/deletions",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Seller: withdraw a pending deletion request (or clear a rejected one). */
export async function cancelMyAccountDeletion(): Promise<ActionResult> {
  const user = await requireUser();
  const ref = adminDb.collection("account_deletion_requests").doc(user.uid);
  const snap = await ref.get();
  if (snap.exists && snap.get("kind") === "seller") await ref.delete();
  revalidatePath("/", "layout");
  return { ok: true };
}
