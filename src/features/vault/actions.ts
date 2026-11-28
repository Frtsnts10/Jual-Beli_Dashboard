"use server";

import { demoBlocked } from "@/lib/access/demo";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { encryptSecret } from "@/lib/vault-crypto";
import { notifyRestock } from "@/lib/integrations/automation";
import { normalizeStockConfig, type StockLine } from "@/lib/stock-config";

export type { StockLine } from "@/lib/stock-config";

/** Older callers (spreadsheet import) still send the classic email / password / PIN columns. */
export interface CredentialLine {
  account_email: string;
  account_password: string;
  profile_pin: string;
  expiry_date: string; // yyyy-mm-dd or ""
}

const MAX_BATCH = 400; // Firestore batch limit is 500 writes

const toStockLine = (l: StockLine | CredentialLine): StockLine =>
  "values" in l ? l : { values: { email: l.account_email, password: l.account_password, pin: l.profile_pin }, expiry_date: l.expiry_date };

export async function addCredentials(storeId: string, productId: string, input: (StockLine | CredentialLine)[]): Promise<ActionResult<{ added: number }>> {
  const demo = await demoBlocked();
  if (demo) return demo;
  const { features } = await requireStore(storeId);
  const product = await adminDb.collection("products").doc(productId).get();
  if (!product.exists || product.get("store_id") !== storeId) return fail("Produk tidak ditemukan.");
  if ((product.get("bundle_items") as string[] | null)?.length) return fail("Stok bundle diambil dari produk isinya — tambahkan stok ke produk-produk tersebut.");
  const config = normalizeStockConfig(product.get("stock_config"));

  const rows = input.map(toStockLine).map((l) => ({
    expiry_date: (l.expiry_date ?? "").trim(),
    values: Object.fromEntries(config.fields.map((f) => [f.key, String(l.values?.[f.key] ?? "").trim().slice(0, 500)])),
  }));
  const missing = rows.findIndex((r) => config.fields.some((f) => f.required && !r.values[f.key]));
  if (rows.length === 0) return fail("Tidak ada baris untuk disimpan.");
  if (missing >= 0) {
    const need = config.fields.filter((f) => f.required).map((f) => f.label).join(", ");
    return fail(`Baris ${missing + 1} belum lengkap. Wajib diisi: ${need}.`);
  }
  if (rows.length > MAX_BATCH) return fail(`Maksimal ${MAX_BATCH} baris sekali impor.`);

  for (const row of rows) {
    if (row.expiry_date && Number.isNaN(Date.parse(row.expiry_date))) {
      return fail(`Tanggal tidak valid: ${row.expiry_date} (pakai format YYYY-MM-DD).`);
    }
  }

  const tier = features;
  if (Number.isFinite(tier.maxCredentials)) {
    const current = await adminDb
      .collection("credentials_vault")
      .where("store_id", "==", storeId)
      .where("status", "==", "AVAILABLE")
      .count()
      .get();
    if (current.data().count + rows.length > tier.maxCredentials) {
      return fail(`Paket ${tier.name} maksimal ${tier.maxCredentials} stok tersedia. Sisa kuota: ${Math.max(0, tier.maxCredentials - current.data().count)}.`);
    }
  }

  try {
    encryptSecret("probe"); // fail fast, before any write, if production has no key
  } catch {
    return fail("Brankas belum dikonfigurasi (VAULT_ENCRYPTION_KEY). Hubungi admin platform.");
  }
  const batch = adminDb.batch();
  const display = config.fields.find((f) => !f.secret);
  for (const row of rows) {
    const fields = Object.fromEntries(config.fields.map((f) => [f.key, f.secret ? encryptSecret(row.values[f.key]) : row.values[f.key]]));
    batch.create(adminDb.collection("credentials_vault").doc(), {
      store_id: storeId,
      product_id: productId,
      fields,
      // Legacy columns, kept so older readers and searches still work.
      account_email: display ? row.values[display.key] : "",
      account_password: encryptSecret(row.values.password ?? ""),
      profile_pin: encryptSecret(row.values.pin ?? ""),
      slots_total: config.slots,
      slots_used: 0,
      status: "AVAILABLE",
      expiry_date: row.expiry_date ? Timestamp.fromDate(new Date(`${row.expiry_date}T23:59:59+07:00`)) : null,
      order_id: null,
      sold_at: null,
      created_at: FieldValue.serverTimestamp(),
    });
  }
  // Stock counts sales, not entries: a shared entry adds one unit per slot.
  batch.update(product.ref, { stock_available: FieldValue.increment(rows.length * config.slots) });
  await batch.commit();
  revalidatePath(`/${storeId}`, "layout");
  // Buyers who tapped "Kabari saya" while it was sold out get a WhatsApp, after responding.
  after(() => notifyRestock(storeId, [productId]));
  return { ok: true, data: { added: rows.length } };
}

/** Keeps products.stock_available in step when an AVAILABLE credential leaves the pool. */
async function removeFromPool(storeId: string, credentialId: string, change: "expire" | "delete") {
  const ref = adminDb.collection("credentials_vault").doc(credentialId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get("store_id") !== storeId) return "not_found" as const;
    const used = (snap.get("slots_used") as number | undefined) ?? (snap.get("status") === "SOLD" ? 1 : 0);
    // A shared entry already sold to someone stays: those buyers still use it.
    if (change === "delete" && (snap.get("status") === "SOLD" || used > 0)) return "sold" as const;
    if (snap.get("status") === "AVAILABLE") {
      const free = Math.max(0, ((snap.get("slots_total") as number | undefined) ?? 1) - used);
      tx.update(adminDb.collection("products").doc(snap.get("product_id")), { stock_available: FieldValue.increment(-free) });
    }
    if (change === "delete") tx.delete(ref);
    else tx.update(ref, { status: "EXPIRED" });
    return "ok" as const;
  });
}

export async function expireCredential(storeId: string, credentialId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  if ((await removeFromPool(storeId, credentialId, "expire")) === "not_found") return fail("Stok tidak ditemukan.");
  revalidatePath(`/${storeId}/vault`);
  return { ok: true };
}

export async function deleteCredential(storeId: string, credentialId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  const result = await removeFromPool(storeId, credentialId, "delete");
  if (result === "not_found") return fail("Stok tidak ditemukan.");
  if (result === "sold") return fail("Stok yang sudah terjual (termasuk sebagian slot) tidak bisa dihapus. Tandai kedaluwarsa saja.");
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}
