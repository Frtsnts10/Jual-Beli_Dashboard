"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { PLATFORM_TYPES, TIERS } from "@/config/tiers";
import type { PlatformType } from "@/types/schema";

export interface ProductInput {
  title: string;
  description: string;
  image_url: string;
  platform_type: PlatformType;
  price: number;
  duration_days: number;
  is_flash_sale: boolean;
  /** Ultimate only. ISO timestamp for the end of the sale; both null for a plain label. */
  flash_sale_price: number | null;
  flash_sale_ends_at: string | null;
  is_published: boolean;
}

function validate(input: ProductInput): string | null {
  if (input.title.trim().length < 2) return "Judul produk terlalu pendek.";
  if (!PLATFORM_TYPES.includes(input.platform_type)) return "Kategori tidak dikenal.";
  if (!Number.isInteger(input.price) || input.price < 1000) return "Harga minimal Rp 1.000.";
  if (!Number.isInteger(input.duration_days) || input.duration_days < 1 || input.duration_days > 3650) {
    return "Durasi 1–3650 hari.";
  }
  if (input.image_url && !/^https:\/\//.test(input.image_url)) return "URL gambar harus diawali https://";
  if (input.flash_sale_price != null) {
    if (!Number.isInteger(input.flash_sale_price) || input.flash_sale_price < 1000) return "Harga flash sale minimal Rp 1.000.";
    if (input.flash_sale_price >= input.price) return "Harga flash sale harus lebih murah dari harga normal.";
    if (!input.flash_sale_ends_at || Number.isNaN(Date.parse(input.flash_sale_ends_at))) return "Isi waktu berakhir flash sale.";
  }
  return null;
}

function clean(input: ProductInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim().slice(0, 2000),
    image_url: input.image_url.trim() || null,
    platform_type: input.platform_type,
    price: input.price,
    duration_days: input.duration_days,
    is_flash_sale: input.is_flash_sale,
    flash_sale_price: input.is_flash_sale ? input.flash_sale_price : null,
    flash_sale_ends_at:
      input.is_flash_sale && input.flash_sale_price != null && input.flash_sale_ends_at
        ? Timestamp.fromDate(new Date(input.flash_sale_ends_at))
        : null,
    is_published: input.is_published,
  };
}

export async function saveProduct(storeId: string, productId: string | null, input: ProductInput): Promise<ActionResult> {
  const { user } = await requireStore(storeId);
  const error = validate(input);
  if (error) return fail(error);
  if (input.flash_sale_price != null && !TIERS[user.subscription_tier].marketing) {
    return fail("Harga & timer flash sale adalah fitur paket Ultimate.");
  }

  if (productId) {
    const ref = adminDb.collection("products").doc(productId);
    const snap = await ref.get();
    if (!snap.exists || snap.get("store_id") !== storeId) return fail("Produk tidak ditemukan.");
    await ref.update({ ...clean(input), updated_at: FieldValue.serverTimestamp() });
  } else {
    await adminDb.collection("products").add({
      ...clean(input),
      store_id: storeId,
      stock_available: 0,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}

export async function setProductPublished(storeId: string, productId: string, published: boolean): Promise<ActionResult> {
  await requireStore(storeId);
  const ref = adminDb.collection("products").doc(productId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return fail("Produk tidak ditemukan.");
  await ref.update({ is_published: published, updated_at: FieldValue.serverTimestamp() });
  revalidatePath(`/${storeId}/products`);
  return { ok: true };
}

export async function deleteProduct(storeId: string, productId: string): Promise<ActionResult> {
  await requireStore(storeId);
  const ref = adminDb.collection("products").doc(productId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return fail("Produk tidak ditemukan.");

  // Orders keep a product_id reference, so a product with sales history is only unpublished.
  const [vault, orders] = await Promise.all([
    adminDb.collection("credentials_vault").where("product_id", "==", productId).limit(1).get(),
    adminDb.collection("orders").where("product_id", "==", productId).limit(1).get(),
  ]);
  if (!vault.empty || !orders.empty) {
    return fail("Produk punya stok atau riwayat pesanan. Sembunyikan (unpublish) saja.");
  }
  await ref.delete();
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}
