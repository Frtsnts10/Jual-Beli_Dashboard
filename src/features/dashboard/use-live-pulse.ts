"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const EVERY_MS = 8_000;

/**
 * Polls a small fingerprint while the tab is visible (every 8 s, and at once when the tab comes
 * back) and re-renders the page in place when it changes — server components re-fetch, client
 * state is kept. `describe` turns a change into a toast (null: refresh quietly).
 */
export function useLivePulse<T extends object>(poll: () => Promise<T>, describe: (before: T, now: T) => string | null, key = "") {
  const router = useRouter();
  const last = useRef<T | null>(null);
  const fns = useRef({ poll, describe });
  useEffect(() => {
    fns.current = { poll, describe };
  });

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    last.current = null;

    async function tick() {
      if (document.visibilityState === "visible") {
        try {
          const now = await fns.current.poll();
          const prev = last.current;
          last.current = now;
          if (prev && JSON.stringify(prev) !== JSON.stringify(now)) {
            const what = fns.current.describe(prev, now);
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
  }, [router, key]);
}
