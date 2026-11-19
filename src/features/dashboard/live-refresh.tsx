"use client";

import { storePulse, type StorePulse } from "./live-actions";
import { useLivePulse } from "./use-live-pulse";

/** What changed between two pulses, in the seller's words (null: nothing worth a toast). */
function describe(a: StorePulse, b: StorePulse): string | null {
  if (b.orders > a.orders) return b.orders - a.orders === 1 ? "Pesanan baru masuk" : `${b.orders - a.orders} pesanan baru masuk`;
  if (b.awaiting > a.awaiting) return "Pembeli mengunggah bukti pembayaran";
  if (b.claims > a.claims) return "Klaim garansi baru";
  if (b.banners > a.banners) return "Pengumuman baru dari admin";
  if (b.notes > a.notes) return "Notifikasi baru";
  return null;
}

/** Keeps every store page live: new orders, payment proofs, claims, announcements. */
export function LiveRefresh({ storeId }: { storeId: string }) {
  useLivePulse(() => storePulse(storeId), describe, storeId);
  return null;
}
