// Same shape as the storefront's src/lib/rating.ts — keep both in sync.

/** products/{id}.rating — count of VISIBLE reviews per star. */
export type RatingCounts = Record<"1" | "2" | "3" | "4" | "5", number>;

export const STARS = ["5", "4", "3", "2", "1"] as const;

export function ratingCounts(v: unknown): RatingCounts {
  const src = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const n = (k: string) => (typeof src[k] === "number" && (src[k] as number) > 0 ? Math.floor(src[k] as number) : 0);
  return { "1": n("1"), "2": n("2"), "3": n("3"), "4": n("4"), "5": n("5") };
}

export function ratingSummary(c: RatingCounts) {
  const count = STARS.reduce((s, k) => s + c[k], 0);
  const sum = STARS.reduce((s, k) => s + Number(k) * c[k], 0);
  return { count, avg: count ? Math.round((sum / count) * 10) / 10 : 0 };
}

type ReviewState = { rating: number; hidden: boolean } | null;

/**
 * How products.rating changes when a review goes from `before` to `after` (null = absent).
 * Only visible reviews are counted. Returns star → +1/-1, without zero entries.
 */
export function ratingDelta(before: ReviewState, after: ReviewState): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (r: ReviewState, n: number) => {
    if (!r || r.hidden) return;
    const k = String(r.rating);
    out[k] = (out[k] ?? 0) + n;
    if (out[k] === 0) delete out[k];
  };
  add(before, -1);
  add(after, 1);
  return out;
}
