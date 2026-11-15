import "server-only";
import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { toISO } from "@/lib/data/mappers";
import type { StorePayment } from "@/types/schema";

/** platform/settings — the platform's own QRIS that sellers pay plan purchases into. */
export const getPlatformQris = cache(async (): Promise<StorePayment | null> => {
  const snap = await adminDb.collection("platform").doc("settings").get();
  const q = snap.get("qris");
  return q?.qris_payload ? { qris_payload: q.qris_payload, merchant_name: q.merchant_name ?? "", nmid: q.nmid ?? null, updated_at: toISO(q.updated_at) ?? "" } : null;
});
