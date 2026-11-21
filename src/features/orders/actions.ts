"use server";

import { demoBlocked } from "@/lib/access/demo";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { fulfillOrder, replaceCredential } from "@/lib/payments/fulfillment";
import { deliverOrder, noticeBuyer } from "@/lib/integrations/automation";
import { failOrder, groupOf } from "@/lib/payments/manual";

async function ownedOrder(storeId: string, orderId: string) {
  const ref = adminDb.collection("orders").doc(orderId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return null;
  return { ref, snap };
}

/**
 * The seller checked their QRIS mutations and the money is there: PAID, allocate and deliver.
 * A cart was one transfer, so every order in it is confirmed together. Also allocates stock
 * to a paid order that was waiting for a restock (that order only).
 */
export async function confirmPayment(storeId: string, orderId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  const allocatingOnly = found.snap.get("payment_status") === "PAID";
  const targets = allocatingOnly ? [found.snap] : (await groupOf(storeId, orderId)).filter((d) => d.get("payment_status") !== "PAID");
  let short = 0;
  for (const o of targets) {
    const wasWaitingForStock = o.get("needs_stock") === true;
    const result = await fulfillOrder(o.id);
    if (result === "fulfilled") await deliverOrder(o.id, wasWaitingForStock ? "restock" : "paid");
    if (result === "needs_stock") short++;
  }
  // Payment confirmed (not just stock allocated): the buyer gets one WhatsApp with the receipt.
  if (!allocatingOnly && targets.length) after(() => noticeBuyer((found.snap.get("group_id") as string | undefined) ?? orderId, "paid"));
  revalidatePath(`/${storeId}`, "layout");
  if (short)
    return fail(
      `${targets.length > 1 ? `${short} dari ${targets.length} pesanan` : "Pesanan"} ditandai lunas, tapi stok brankas kosong. Tambah stok lalu klik Alokasikan.`,
    );
  return { ok: true };
}

export async function markDelivered(storeId: string, orderId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  if (!found.snap.get("credential_id")) return fail("Belum ada akun yang dialokasikan.");
  await found.ref.update({ delivery_status: "SENT_VIA_WA" });
  revalidatePath(`/${storeId}/orders`);
  return { ok: true };
}

export async function replaceWarranty(storeId: string, orderId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
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
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  await found.ref.update({ warranty_status: "VALID", warranty_claim: null });
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}

/** Retries automatic WhatsApp delivery (Pro & Ultimate) after a failure. */
export async function resendDelivery(storeId: string, orderId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  if (!(await ownedOrder(storeId, orderId))) return fail("Pesanan tidak ditemukan.");
  const result = await deliverOrder(orderId, "paid");
  revalidatePath(`/${storeId}/orders`);
  if (result === "skipped") return fail("Pengiriman otomatis belum tersedia di paket Anda, atau provider WhatsApp belum diatur di Pengaturan.");
  if (result === "failed") return fail("Pengiriman otomatis gagal lagi. Cek koneksi n8n / token WhatsApp.");
  return { ok: true };
}

/** The buyer's payment screenshot, for the seller's "Cek bukti" dialog. */
export async function getPaymentProof(storeId: string, orderId: string): Promise<ActionResult<{ image: string; uploadedAt: string | null }>> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  // One proof per checkout, stored under the group's lead order.
  const proof = await adminDb
    .collection("payment_proofs")
    .doc((found.snap.get("group_id") as string | undefined) ?? orderId)
    .get();
  if (!proof.exists) return fail("Pembeli belum mengunggah bukti pembayaran.");
  return { ok: true, data: { image: proof.get("image") as string, uploadedAt: proof.get("uploaded_at")?.toDate?.().toISOString() ?? null } };
}

/** The transfer isn't in the seller's mutations (or doesn't match): the order fails, its voucher use is freed. */
export async function rejectPayment(storeId: string, orderId: string, reason: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const found = await ownedOrder(storeId, orderId);
  if (!found) return fail("Pesanan tidak ditemukan.");
  const why = reason.trim().slice(0, 200);
  if (why.length < 3) return fail('Tulis alasan singkat, mis. "Dana tidak masuk".');
  // A cart was one transfer: rejecting it cancels every order in it.
  let failed = 0;
  for (const o of await groupOf(storeId, orderId)) if (await failOrder(o.id, why)) failed++;
  if (!failed) return fail("Pesanan ini sudah tidak menunggu pembayaran.");
  after(() => noticeBuyer((found.snap.get("group_id") as string | undefined) ?? orderId, "rejected", why));
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}
