"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { fulfillOrder, replaceCredential } from "@/lib/payments/fulfillment";
import { deliverOrder } from "@/lib/integrations/automation";
import { failOrder } from "@/lib/payments/manual";

async function ownedOrder(storeId: string, orderId: string) {
  const ref = adminDb.collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return null;
  return { ref, snap };
}

/**
 * The seller checked their QRIS mutations and the money is there: PAID, allocate and deliver.
 * Also allocates stock to a paid order that was waiting for a restock.
 */
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

/** The buyer's payment screenshot, for the seller's "Cek bukti" dialog. */
export async function getPaymentProof(storeId: string, orderId: string): Promise<ActionResult<{ image: string; uploadedAt: string | null }>> {
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  const proof = await adminDb.collection("payment_proofs").doc(orderId).get();
  if (!proof.exists) return fail("Pembeli belum mengunggah bukti pembayaran.");
  return { ok: true, data: { image: proof.get("image") as string, uploadedAt: proof.get("uploaded_at")?.toDate?.().toISOString() ?? null } };
}

/** The transfer isn't in the seller's mutations (or doesn't match): the order fails, its voucher use is freed. */
export async function rejectPayment(storeId: string, orderId: string, reason: string): Promise<ActionResult> {
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  const why = reason.trim().slice(0, 200);
  if (why.length < 3) return fail("Tulis alasan singkat, mis. \"Dana tidak masuk\".");
  if (!(await failOrder(orderId, why))) return fail("Pesanan ini sudah tidak menunggu pembayaran.");
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}
