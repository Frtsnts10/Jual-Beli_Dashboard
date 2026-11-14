"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { fulfillOrder, replaceCredential } from "@/lib/fulfillment";
import { deliverOrder } from "@/lib/automation";

async function ownedOrder(storeId: string, orderId: string) {
  const ref = adminDb.collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return null;
  return { ref, snap };
}

/** Manual payment confirmation (e.g. bank transfer) — also used to allocate stock to a paid order after restocking. */
export async function confirmPayment(storeId: string, orderId: string): Promise<ActionResult> {
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  const wasWaitingForStock = found.snap.get("needs_stock") === true;
  const result = await fulfillOrder(orderId);
  if (result === "fulfilled") await deliverOrder(orderId, wasWaitingForStock ? "restock" : "paid");
  revalidatePath(`/${storeId}`, "layout");
  if (result === "needs_stock") return fail("Pesanan ditandai lunas, tapi stok brankas kosong. Tambah stok lalu klik Alokasikan.");
  return { ok: true };
}

export async function markDelivered(storeId: string, orderId: string): Promise<ActionResult> {
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  if (!found.snap.get("credential_id")) return fail("Belum ada akun yang dialokasikan.");
  await found.ref.update({ delivery_status: "SENT_VIA_WA" });
  revalidatePath(`/${storeId}/orders`);
  return { ok: true };
}

export async function replaceWarranty(storeId: string, orderId: string): Promise<ActionResult> {
  await requireStore(storeId);
  if (!(await ownedOrder(storeId, orderId))) return fail("Pesanan tidak ditemukan.");
  const result = await replaceCredential(orderId);
  if (result === "replaced") await deliverOrder(orderId, "warranty_replacement");
  revalidatePath(`/${storeId}`, "layout");
  if (result === "needs_stock") return fail("Stok pengganti kosong. Tambah stok untuk produk ini dulu.");
  if (result === "not_paid") return fail("Pesanan belum lunas.");
  return { ok: true };
}

export async function rejectWarranty(storeId: string, orderId: string): Promise<ActionResult> {
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  await found.ref.update({ warranty_status: "VALID", warranty_claim: null });
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}

/** Retries automatic WhatsApp delivery (Pro & Ultimate) after a failure. */
export async function resendDelivery(storeId: string, orderId: string): Promise<ActionResult> {
  await requireStore(storeId);
  if (!(await ownedOrder(storeId, orderId))) return fail("Pesanan tidak ditemukan.");
  const result = await deliverOrder(orderId, "paid");
  revalidatePath(`/${storeId}/orders`);
  if (result === "skipped") return fail("Pengiriman otomatis butuh paket Pro/Ultimate dan provider WhatsApp di Pengaturan.");
  if (result === "failed") return fail("Pengiriman otomatis gagal lagi. Cek koneksi n8n / token WhatsApp.");
  return { ok: true };
}
