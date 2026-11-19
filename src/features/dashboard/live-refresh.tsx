"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { storePulse, type StorePulse } from "./live-actions";

const EVERY_MS = 8_000;

/** What changed between two pulses, in the seller's words (null: nothing worth a toast). */
function describe(a: StorePulse, b: StorePulse): string | null {
  if (b.orders > a.orders) return b.orders - a.orders === 1 ? "Pesanan baru masuk" : `${b.orders - a.orders} pesanan baru masuk`;
  if (b.awaiting > a.awaiting) return "Pembeli mengunggah bukti pembayaran";
  if (b.claims > a.claims) return "Klaim garansi baru";
  if (b.banners > a.banners) return "Pengumuman baru dari admin";
  if (b.notes > a.notes) return "Notifikasi baru";
  return null;
}

/**
 * Keeps every dashboard page live: polls the store's order fingerprint while the tab is
 * visible and re-renders the page (server components re-fetch, client state is kept) when an
 * order arrives, a payment proof comes in or a payment/claim changes state.
 */
export function LiveRefresh({ storeId }: { storeId: string }) {
  const router = useRouter();
  const last = useRef<StorePulse | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick() {
      if (document.visibilityState === "visible") {
        try {
          const now = await storePulse(storeId);
          const prev = last.current;
          last.current = now;
          if (prev && JSON.stringify(prev) !== JSON.stringify(now)) {
            const what = describe(prev, now);
            if (what) toast.info(what);
            router.refresh();
          }
        } catch {
          // offline or signed out: try again next tick
        }
      }
      if (!stopped) timer = setTimeout(tick, EVERY_MS);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void tick();
      }
    };
    void tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [storeId, router]);

  return null;
}
