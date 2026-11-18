import "server-only";
import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { effectiveTier } from "@/lib/data/mappers";
import { cleanOverrides, mergeCatalog, resolveFeatures, type Catalog } from "@/lib/catalog-core";
import type { TierConfig } from "@/config/tiers";

export * from "@/lib/catalog-core";

/** platform/catalog merged over the defaults; read once per request. */
export const getCatalog = cache(async (): Promise<Catalog> => {
  try {
    const snap = await adminDb.collection("platform").doc("catalog").get();
    return mergeCatalog(snap.data());
  } catch (err) {
    // Never take the site down over the catalog: the built-in plans still work.
    console.error("platform/catalog unreadable, using defaults", err);
    return mergeCatalog(null);
  }
});

/** A user's effective plan and features (from their users doc). */
export async function featuresOfUser(user: FirebaseFirestore.DocumentSnapshot): Promise<TierConfig> {
  const catalog = await getCatalog();
  return resolveFeatures(catalog, effectiveTier(user.get("subscription_tier"), user.get("subscription_expiry")), cleanOverrides(user.get("feature_overrides")));
}

export const featuresOfUid = cache(async (uid: string): Promise<TierConfig> => featuresOfUser(await adminDb.collection("users").doc(uid).get()));
