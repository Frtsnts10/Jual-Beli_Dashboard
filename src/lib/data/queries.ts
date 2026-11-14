import "server-only";
import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { mapCredential, mapOrder, mapProduct, mapReview } from "@/lib/data/mappers";
import type { CredentialStatus, CustomerProfile } from "@/types/schema";
import { aggregateCustomers } from "./customers";

// All queries filter by store_id; callers must have passed requireStore(storeId) first.

export const listProducts = cache(async (storeId: string) => {
  const snap = await adminDb.collection("products").where("store_id", "==", storeId).get();
  return snap.docs.map(mapProduct).sort((a, b) => b.created_at.localeCompare(a.created_at));
});

export async function listCredentials(storeId: string, status: CredentialStatus) {
  const snap = await adminDb
    .collection("credentials_vault")
    .where("store_id", "==", storeId)
    .where("status", "==", status)
    .limit(500)
    .get();
  return snap.docs.map(mapCredential).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function countCredentials(storeId: string, status: CredentialStatus, productId?: string) {
  let q = adminDb.collection("credentials_vault").where("store_id", "==", storeId).where("status", "==", status);
  if (productId) q = q.where("product_id", "==", productId);
  return (await q.count().get()).data().count;
}

export async function stockByProduct(storeId: string) {
  const snap = await adminDb
    .collection("credentials_vault")
    .where("store_id", "==", storeId)
    .where("status", "==", "AVAILABLE")
    .select("product_id")
    .get();
  const counts: Record<string, number> = {};
  for (const doc of snap.docs) counts[doc.get("product_id")] = (counts[doc.get("product_id")] ?? 0) + 1;
  return counts;
}

export async function listOrders(storeId: string, limit = 200) {
  const snap = await adminDb
    .collection("orders")
    .where("store_id", "==", storeId)
    .orderBy("created_at", "desc")
    .limit(limit)
    .get();
  return snap.docs.map(mapOrder);
}

export const countOpenClaims = cache(async (storeId: string) => {
  const snap = await adminDb
    .collection("orders")
    .where("store_id", "==", storeId)
    .where("warranty_status", "==", "CLAIMED")
    .count()
    .get();
  return snap.data().count;
});

export async function getCredentialsByIds(ids: string[]) {
  if (ids.length === 0) return {};
  ids = [...new Set(ids)];
  const refs = ids.map((id) => adminDb.collection("credentials_vault").doc(id));
  const snaps = await adminDb.getAll(...refs);
  return Object.fromEntries(snaps.filter((s) => s.exists).map((s) => [s.id, mapCredential(s)]));
}

/** customers/{uid} profiles for the given buyer accounts (missing/deleted ones are skipped). */
export async function getCustomerProfiles(uids: string[]): Promise<Map<string, CustomerProfile>> {
  const unique = [...new Set(uids)].filter(Boolean);
  if (unique.length === 0) return new Map();
  const snaps = await adminDb.getAll(...unique.map((uid) => adminDb.collection("customers").doc(uid)));
  return new Map(
    snaps
      .filter((s) => s.exists)
      .map((s) => [s.id, { uid: s.id, email: s.get("email") ?? "", name: s.get("name") ?? "", phone: s.get("phone") ?? "" }])
  );
}

/** A store's customers, grouped from its most recent orders. */
export async function listCustomers(storeId: string) {
  const orders = await listOrders(storeId, 2000);
  const profiles = await getCustomerProfiles(orders.map((o) => o.customer_uid ?? ""));
  return { orders, customers: aggregateCustomers(orders, profiles) };
}

/** The store's newest reviews (visible and hidden) for moderation. */
export async function listReviews(storeId: string, limit = 300) {
  const snap = await adminDb.collection("reviews").where("store_id", "==", storeId).orderBy("created_at", "desc").limit(limit).get();
  return snap.docs.map(mapReview);
}
