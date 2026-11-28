"use server";

import { demoBlocked } from "@/lib/access/demo";
import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { PLATFORM_TYPES } from "@/config/tiers";
import type { PlatformType } from "@/types/schema";
import { isImageUrl } from "@/lib/media-kinds";
import { normalizeFocus, type ImageFocus } from "@/lib/image-focus";
import { normalizeStockConfig, type StockConfig } from "@/lib/stock-config";

export interface ProductInput {
  title: string;
  description: string;
  /** S&K produk; optional. */
  terms: string;
  image_url: string;
  image_focus: ImageFocus | null;
  stock_config?: StockConfig;
  platform_type: PlatformType;
  price: number;
  duration_days: number;
  is_flash_sale: boolean;
  /** Ultimate only: component product ids for a bundle, or null for a normal product. */
  bundle_items: string[] | null;
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
  if (input.image_url && !isImageUrl(input.image_url)) return "URL gambar harus diawali https://";
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
    terms: (input.terms ?? "").trim().slice(0, 3000),
    image_url: input.image_url.trim() || null,
    image_focus: input.image_url.trim() ? normalizeFocus(input.image_focus) : null,
    stock_config: normalizeStockConfig(input.stock_config),
    platform_type: input.platform_type,
    price: input.price,
    duration_days: input.duration_days,
    bundle_items: input.bundle_items?.length ? input.bundle_items : null,
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
  const demo = await demoBlocked();
  if (demo) return demo;
  const { features } = await requireStore(storeId);
  const error = validate(input);
  if (error) return fail(error);
  if (input.flash_sale_price != null && !features.marketing) {
    return fail("Flash sale belum tersedia di paket Anda.");
  }
  if (input.bundle_items?.length) {
    if (!features.marketing) return fail("Bundling belum tersedia di paket Anda.");
    const items = [...new Set(input.bundle_items)];
    if (items.length < 2) return fail("Bundle butuh minimal 2 produk.");
    if (productId && items.includes(productId)) return fail("Bundle tidak bisa berisi dirinya sendiri.");
    const parts = await adminDb.getAll(...items.map((id) => adminDb.collection("products").doc(id)));
    if (parts.some((p) => !p.exists || p.get("store_id") !== storeId)) return fail("Isi bundle harus produk dari toko ini.");
    if (parts.some((p) => (p.get("bundle_items") as string[] | null)?.length)) return fail("Bundle tidak bisa berisi bundle lain.");
    if (productId) {
      const usedIn = await adminDb.collection("products").where("bundle_items", "array-contains", productId).limit(1).get();
      if (!usedIn.empty) return fail("Produk ini sudah jadi isi bundle lain, jadi tidak bisa dijadikan bundle.");
    }
    input = { ...input, bundle_items: items };
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
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const ref = adminDb.collection("products").doc(productId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return fail("Produk tidak ditemukan.");
  await ref.update({ is_published: published, updated_at: FieldValue.serverTimestamp() });
  revalidatePath(`/${storeId}/products`);
  return { ok: true };
}

export async function deleteProduct(storeId: string, productId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const ref = adminDb.collection("products").doc(productId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return fail("Produk tidak ditemukan.");

  // Orders keep a product_id reference, so a product with sales history is only unpublished.
  const [vault, orders, bundles] = await Promise.all([
    adminDb.collection("credentials_vault").where("product_id", "==", productId).limit(1).get(),
    adminDb.collection("orders").where("product_id", "==", productId).limit(1).get(),
    adminDb.collection("products").where("bundle_items", "array-contains", productId).limit(1).get(),
  ]);
  if (!bundles.empty) return fail("Produk ini dipakai di bundle. Keluarkan dari bundle dulu.");
  if (!vault.empty || !orders.empty) {
    return fail("Produk punya stok atau riwayat pesanan. Sembunyikan (unpublish) saja.");
  }
  await ref.delete();
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}

/** Spreadsheet import: plain products only (no flash sale / bundle), validated again here. */
export async function importProducts(
  storeId: string,
  rows: Pick<ProductInput, "title" | "platform_type" | "price" | "duration_days" | "description" | "image_url" | "is_published">[]
): Promise<ActionResult<{ added: number }>> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  if (rows.length === 0) return fail("Tidak ada baris valid untuk diimpor.");
  if (rows.length > 200) return fail("Maksimal 200 produk sekali impor.");
  const inputs: ProductInput[] = rows.map((r) => ({ ...r, terms: "", image_focus: null, is_flash_sale: false, bundle_items: null, flash_sale_price: null, flash_sale_ends_at: null }));
  for (const [i, input] of inputs.entries()) {
    const error = validate(input);
    if (error) return fail(`Baris ${i + 1}: ${error}`);
  }
  const existing = await adminDb.collection("products").where("store_id", "==", storeId).select("title").get();
  const taken = new Set(existing.docs.map((d) => String(d.get("title")).trim().toLowerCase()));
  const fresh = inputs.filter((p) => !taken.has(p.title.trim().toLowerCase()));
  if (fresh.length === 0) return fail("Semua judul sudah ada di toko.");
  const batch = adminDb.batch();
  for (const input of fresh) {
    batch.create(adminDb.collection("products").doc(), {
      ...clean(input),
      store_id: storeId,
      stock_available: 0,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true, data: { added: fresh.length } };
}
