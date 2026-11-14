"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { ratingDelta } from "@/lib/rating";

/** Hides or shows a review on the storefront, keeping the product's star counts in step. */
export async function setReviewHidden(storeId: string, reviewId: string, hidden: boolean): Promise<ActionResult> {
  await requireStore(storeId);
  const ref = adminDb.collection("reviews").doc(reviewId);
  const result = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get("store_id") !== storeId) return "not_found" as const;
    const rating = Number(snap.get("rating"));
    const delta = ratingDelta({ rating, hidden: !!snap.get("hidden") }, { rating, hidden });
    const productRef = adminDb.collection("products").doc(snap.get("product_id"));
    const product = await tx.get(productRef);
    if (product.exists && Object.keys(delta).length) {
      tx.update(productRef, Object.fromEntries(Object.entries(delta).map(([k, n]) => [`rating.${k}`, FieldValue.increment(n)])));
    }
    tx.update(ref, { hidden });
    return "ok" as const;
  });
  if (result === "not_found") return fail("Ulasan tidak ditemukan.");
  revalidatePath(`/${storeId}/reviews`);
  return { ok: true };
}
