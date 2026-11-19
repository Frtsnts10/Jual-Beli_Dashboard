"use server";

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/access/auth";
import { isPlatformAdmin } from "@/lib/access/platform";
import { notify, platformAdminUids } from "@/lib/notify";
import { fail, type ActionResult } from "@/lib/action-result";

/**
 * Seller asks for their account to be deleted. A platform admin reviews it in Hapus akun
 * (within 7 days): approving closes the seller's stores, wipes their stock vault and removes
 * the login (lib/sellers/account-deletion.ts).
 */
export async function requestSellerDeletion(reason: string, confirm: string): Promise<ActionResult> {
  const user = await requireUser();
  if (await isPlatformAdmin()) return fail("Akun admin tidak bisa dihapus dari sini.");
  if (confirm.trim().toUpperCase() !== "HAPUS") return fail("Ketik HAPUS untuk konfirmasi.");
  const ref = adminDb.collection("account_deletion_requests").doc(user.uid);
  const prev = await ref.get();
  if (prev.exists && prev.get("status") === "PENDING" && prev.get("kind") === "seller")
    return fail("Pengajuan Anda sudah ada dan sedang ditinjau admin.");
  await ref.set({
    kind: "seller",
    status: "PENDING",
    email: user.email,
    name: user.full_name,
    reason: reason.trim().slice(0, 300),
    store_id: null,
    requested_at: FieldValue.serverTimestamp(),
  });
  await notify(await platformAdminUids(), {
    type: "admin_deletion",
    title: "Penjual minta hapus akun",
    body: user.email,
    href: "/platform/deletions",
  });
  return { ok: true };
}
