"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { TIERS } from "@/config/tiers";

export interface CredentialLine {
  account_email: string;
  account_password: string;
  profile_pin: string;
  expiry_date: string; // yyyy-mm-dd or ""
}

const MAX_BATCH = 400; // Firestore batch limit is 500 writes

export async function addCredentials(storeId: string, productId: string, lines: CredentialLine[]): Promise<ActionResult<{ added: number }>> {
  const { tier: plan } = await requireStore(storeId);
  const product = await adminDb.collection("products").doc(productId).get();
  if (!product.exists || product.get("store_id") !== storeId) return fail("Produk tidak ditemukan.");
  if ((product.get("bundle_items") as string[] | null)?.length) return fail("Stok bundle diambil dari produk isinya — tambahkan stok ke produk-produk tersebut.");

  const rows = lines
    .map((l) => ({ ...l, account_email: l.account_email.trim(), account_password: l.account_password.trim() }))
    .filter((l) => l.account_email && l.account_password);
  if (rows.length === 0) return fail("Tidak ada baris valid (email & password wajib).");
  if (rows.length > MAX_BATCH) return fail(`Maksimal ${MAX_BATCH} baris sekali impor.`);

  for (const row of rows) {
    if (row.expiry_date && Number.isNaN(Date.parse(row.expiry_date))) {
      return fail(`Tanggal tidak valid: ${row.expiry_date} (pakai format YYYY-MM-DD).`);
    }
  }

  const tier = TIERS[plan];
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

  const batch = adminDb.batch();
  for (const row of rows) {
    batch.create(adminDb.collection("credentials_vault").doc(), {
      store_id: storeId,
      product_id: productId,
      account_email: row.account_email,
      account_password: row.account_password,
      profile_pin: row.profile_pin.trim(),
      status: "AVAILABLE",
      expiry_date: row.expiry_date ? Timestamp.fromDate(new Date(`${row.expiry_date}T23:59:59+07:00`)) : null,
      order_id: null,
      sold_at: null,
      created_at: FieldValue.serverTimestamp(),
    });
  }
  batch.update(product.ref, { stock_available: FieldValue.increment(rows.length) });
  await batch.commit();
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true, data: { added: rows.length } };
}

/** Keeps products.stock_available in step when an AVAILABLE credential leaves the pool. */
async function removeFromPool(storeId: string, credentialId: string, change: "expire" | "delete") {
  const ref = adminDb.collection("credentials_vault").doc(credentialId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get("store_id") !== storeId) return "not_found" as const;
    if (change === "delete" && snap.get("status") === "SOLD") return "sold" as const;
    if (snap.get("status") === "AVAILABLE") {
      tx.update(adminDb.collection("products").doc(snap.get("product_id")), { stock_available: FieldValue.increment(-1) });
    }
    if (change === "delete") tx.delete(ref);
    else tx.update(ref, { status: "EXPIRED" });
    return "ok" as const;
  });
}

export async function expireCredential(storeId: string, credentialId: string): Promise<ActionResult> {
  await requireStore(storeId);
  if ((await removeFromPool(storeId, credentialId, "expire")) === "not_found") return fail("Stok tidak ditemukan.");
  revalidatePath(`/${storeId}/vault`);
  return { ok: true };
}

export async function deleteCredential(storeId: string, credentialId: string): Promise<ActionResult> {
  await requireStore(storeId);
  const result = await removeFromPool(storeId, credentialId, "delete");
  if (result === "not_found") return fail("Stok tidak ditemukan.");
  if (result === "sold") return fail("Stok yang sudah terjual tidak bisa dihapus.");
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}
