"use server";

import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireUser, SESSION_COOKIE } from "@/lib/access/auth";
import { isPlatformAdmin } from "@/lib/access/platform";
import { deleteSellerAccount } from "@/lib/sellers/account-deletion";
import { fail, type ActionResult } from "@/lib/action-result";

const DELETE_PHRASE = "HAPUS AKUN SAYA";
/** The password / Google check on the form must be this recent, so a borrowed open laptop can't do it. */
const FRESH_LOGIN_S = 5 * 60;

/**
 * Seller: delete my account and everything in it, now. Requires re-entering the password (or Google
 * sign-in) on the form — `idToken` comes from that fresh sign-in — plus the account email and the
 * confirmation phrase. Irreversible (lib/sellers/account-deletion.ts).
 */
export async function deleteMyAccount(input: { email: string; phrase: string; idToken: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (await isPlatformAdmin()) return fail("Akun admin platform tidak bisa dihapus dari sini.");
  const proof = await adminAuth.verifyIdToken(input.idToken, true).catch(() => null);
  if (!proof || proof.uid !== user.uid) return fail("Verifikasi gagal. Masukkan password akun ini (atau masuk dengan Google akun ini).");
  if (Date.now() / 1000 - proof.auth_time > FRESH_LOGIN_S) return fail("Verifikasi kedaluwarsa. Ulangi.");
  if (input.email.trim().toLowerCase() !== user.email.toLowerCase()) return fail("Email tidak sama dengan email akun ini.");
  if (input.phrase.trim() !== DELETE_PHRASE) return fail(`Ketik persis: ${DELETE_PHRASE}`);

  // Kept without the email: the point of deleting is that it goes.
  await adminDb.collection("platform_audit").add({ action: "seller.self_delete", target: user.uid, by: "seller", details: {}, at: FieldValue.serverTimestamp() });
  await deleteSellerAccount(user.uid);
  (await cookies()).delete(SESSION_COOKIE);
  return { ok: true };
}
