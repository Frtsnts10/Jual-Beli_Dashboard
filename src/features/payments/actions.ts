"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { inspectQris } from "@/lib/qris";

/** Saves the seller's own static QRIS (decoded in the browser from their QR image). */
export async function saveStoreQris(storeId: string, payload: string): Promise<ActionResult<{ merchant: string }>> {
  await requireStore(storeId, { ownerOnly: true });
  const qris = payload.trim();
  if (qris.length > 512) return fail("Kode QR terlalu panjang untuk QRIS.");
  const info = inspectQris(qris);
  if (!info.ok) return fail(info.error);
  await adminDb
    .collection("stores")
    .doc(storeId)
    .update({ payment: { qris_payload: qris, merchant_name: info.merchant, nmid: info.nmid, updated_at: FieldValue.serverTimestamp() } });
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true, data: { merchant: info.merchant } };
}

export async function removeStoreQris(storeId: string): Promise<ActionResult> {
  await requireStore(storeId, { ownerOnly: true });
  await adminDb.collection("stores").doc(storeId).update({ payment: null });
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}
