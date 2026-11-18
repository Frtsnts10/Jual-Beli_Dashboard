"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { CODE_RE, MIN_PAYABLE, normaliseCode, voucherDocId, type VoucherType } from "@/lib/voucher";

export interface VoucherInput {
  code: string;
  type: VoucherType;
  value: number;
  max_discount: number | null;
  min_amount: number;
  max_uses: number | null;
  /** yyyy-mm-dd (end of that day, WIB) or null. */
  expires_on: string | null;
  product_ids: string[] | null;
}

const int = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : NaN);

async function requireVoucherStore(storeId: string) {
  const ctx = await requireStore(storeId);
  return ctx.features.vouchers ? ctx : null;
}

export async function createVoucher(storeId: string, input: VoucherInput): Promise<ActionResult> {
  if (!(await requireVoucherStore(storeId))) return fail("Voucher belum tersedia di paket Anda.");
  const code = normaliseCode(input.code);
  if (!CODE_RE.test(code)) return fail("Kode 3–20 huruf/angka tanpa spasi, mis. HEMAT10.");
  if (input.type !== "percent" && input.type !== "fixed") return fail("Jenis potongan tidak valid.");

  const value = int(input.value);
  if (input.type === "percent" && !(value >= 1 && value <= 90)) return fail("Persen potongan 1–90%.");
  if (input.type === "fixed" && !(value >= MIN_PAYABLE)) return fail("Potongan nominal minimal Rp 1.000.");
  const maxDiscount = input.type === "percent" && input.max_discount !== null ? int(input.max_discount) : null;
  if (maxDiscount !== null && !(maxDiscount >= MIN_PAYABLE)) return fail("Maksimal potongan minimal Rp 1.000.");
  const minAmount = int(input.min_amount ?? 0);
  if (!(minAmount >= 0)) return fail("Minimal belanja tidak valid.");
  const maxUses = input.max_uses === null ? null : int(input.max_uses);
  if (maxUses !== null && !(maxUses >= 1)) return fail("Kuota minimal 1 (kosongkan untuk tanpa batas).");

  let expiresAt: Timestamp | null = null;
  if (input.expires_on) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expires_on)) return fail("Tanggal berakhir tidak valid.");
    // End of that day in WIB (UTC+7).
    const end = new Date(`${input.expires_on}T23:59:59+07:00`);
    if (Number.isNaN(end.getTime()) || end <= new Date()) return fail("Tanggal berakhir harus di masa depan.");
    expiresAt = Timestamp.fromDate(end);
  }

  let productIds: string[] | null = null;
  if (input.product_ids?.length) {
    const ids = [...new Set(input.product_ids)].slice(0, 50);
    const snaps = await adminDb.getAll(...ids.map((id) => adminDb.collection("products").doc(id)));
    if (snaps.some((s) => !s.exists || s.get("store_id") !== storeId)) return fail("Produk tidak ditemukan.");
    productIds = ids;
  }

  try {
    await adminDb.collection("vouchers").doc(voucherDocId(storeId, code)).create({
      store_id: storeId,
      code,
      type: input.type,
      value,
      max_discount: maxDiscount,
      min_amount: minAmount,
      max_uses: maxUses,
      used_count: 0,
      expires_at: expiresAt,
      product_ids: productIds,
      active: true,
      created_at: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 6) return fail(`Kode ${code} sudah ada di toko ini.`);
    throw err;
  }
  revalidatePath(`/${storeId}/vouchers`);
  return { ok: true };
}

async function ownedVoucher(storeId: string, code: string) {
  const ref = adminDb.collection("vouchers").doc(voucherDocId(storeId, normaliseCode(code)));
  const snap = await ref.get();
  return snap.exists && snap.get("store_id") === storeId ? { ref, snap } : null;
}

export async function setVoucherActive(storeId: string, code: string, active: boolean): Promise<ActionResult> {
  if (!(await requireVoucherStore(storeId))) return fail("Voucher belum tersedia di paket Anda.");
  const found = await ownedVoucher(storeId, code);
  if (!found) return fail("Voucher tidak ditemukan.");
  await found.ref.update({ active });
  revalidatePath(`/${storeId}/vouchers`);
  return { ok: true };
}

/** Only never-used vouchers can be deleted; used ones stay for the order history (deactivate instead). */
export async function deleteVoucher(storeId: string, code: string): Promise<ActionResult> {
  await requireStore(storeId);
  const found = await ownedVoucher(storeId, code);
  if (!found) return fail("Voucher tidak ditemukan.");
  if ((found.snap.get("used_count") ?? 0) > 0) return fail("Voucher sudah pernah dipakai. Nonaktifkan saja.");
  await found.ref.delete();
  revalidatePath(`/${storeId}/vouchers`);
  return { ok: true };
}
