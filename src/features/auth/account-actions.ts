"use server";

import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser, requireUser, SESSION_COOKIE } from "@/lib/access/auth";
import { isPlatformAdmin } from "@/lib/access/platform";
import { deleteSellerAccount } from "@/lib/sellers/account-deletion";
import { fail, type ActionResult } from "@/lib/action-result";

const DELETE_PHRASE = "HAPUS AKUN SAYA";
/** The seller must have signed in within this window, so a borrowed open laptop can't do it. */
const FRESH_LOGIN_S = 10 * 60;

/**
 * Seller: delete my account and everything in it, now. Requires a recent sign-in, the account
 * email and the confirmation phrase. Irreversible (lib/sellers/account-deletion.ts).
 */
export async function deleteMyAccount(input: { email: string; phrase: string }): Promise<ActionResult> {
  const user = await requireUser();
  if (await isPlatformAdmin()) return fail("Akun admin platform tidak bisa dihapus dari sini.");
  const session = await getSessionUser();
  if (!session || Date.now() / 1000 - session.auth_time > FRESH_LOGIN_S)
    return fail("Demi keamanan, keluar lalu masuk lagi, kemudian ulangi dalam 10 menit.");
  if (input.email.trim().toLowerCase() !== user.email.toLowerCase()) return fail("Email tidak sama dengan email akun ini.");
  if (input.phrase.trim() !== DELETE_PHRASE) return fail(`Ketik persis: ${DELETE_PHRASE}`);

  // Kept without the email: the point of deleting is that it goes.
  await adminDb.collection("platform_audit").add({ action: "seller.self_delete", target: user.uid, by: "seller", details: {}, at: FieldValue.serverTimestamp() });
  await deleteSellerAccount(user.uid);
  (await cookies()).delete(SESSION_COOKIE);
  return { ok: true };
}
