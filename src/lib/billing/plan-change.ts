import { TIERS } from "@/config/tiers";
import type { SubscriptionTier } from "@/types/schema";

// Changing plans never wastes money: whatever is left of the current paid plan is converted
// at its rupiah value into extra days of the new plan (more days when moving down, fewer when
// moving up). Renewing the same plan simply extends it. Pure, so the Langganan page can show
// the exact outcome before the seller pays, and the activation applies the same numbers.

const DAY_MS = 86_400_000;
const RANK: Record<SubscriptionTier, number> = { starter: 0, pro: 1, ultimate: 2 };

export type PlanChange = "renew" | "upgrade" | "downgrade" | "new";

/** What buying `target` means for someone whose effective plan is `current` (active until `expiry`). */
export function planChange(current: SubscriptionTier, expiry: string | null, target: SubscriptionTier, now = Date.now()): PlanChange {
  const active = current !== "starter" && !!expiry && new Date(expiry).getTime() > now;
  if (!active) return "new";
  if (current === target) return "renew";
  return RANK[target] > RANK[current] ? "upgrade" : "downgrade";
}

/** Daily value of a plan, from its monthly price. */
const daily = (tier: SubscriptionTier) => TIERS[tier].priceMonthly / 30;

/**
 * Whole days of `target` that the unused part of the current plan is worth. 0 for a renewal
 * (the new period is appended to the current one instead) or when nothing paid is left.
 */
export function bonusDays(current: SubscriptionTier, expiry: string | null, target: SubscriptionTier, now = Date.now()): number {
  if (planChange(current, expiry, target, now) !== "upgrade" && planChange(current, expiry, target, now) !== "downgrade") return 0;
  if (target === "starter" || !daily(target)) return 0;
  const remainingDays = (new Date(expiry!).getTime() - now) / DAY_MS;
  return Math.floor((remainingDays * daily(current)) / daily(target));
}

/** New expiry after paying for `periodDays` of `target`. */
export function newExpiry(current: SubscriptionTier, expiry: string | null, target: SubscriptionTier, periodDays: number, now = Date.now()): number {
  if (planChange(current, expiry, target, now) === "renew") return new Date(expiry!).getTime() + periodDays * DAY_MS;
  return now + (periodDays + bonusDays(current, expiry, target, now)) * DAY_MS;
}
