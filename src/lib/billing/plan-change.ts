import { TIERS } from "@/config/tiers";
import type { SubscriptionTier } from "@/types/schema";

// Changing plans never wastes money: whatever is left of the current paid plan is converted
// at its rupiah value into extra days of the new plan (more days when moving down, fewer when
// moving up). Renewing the same plan simply extends it. Pure, so the Langganan page can show
// the exact outcome before the seller pays, and the activation applies the same numbers.

const DAY_MS = 86_400_000;

export type PlanChange = "renew" | "upgrade" | "downgrade" | "new";

/** What buying `target` means for someone whose effective plan is `current` (active until `expiry`). */
export function planChange(current: SubscriptionTier, expiry: string | null, target: SubscriptionTier, now = Date.now(), prices?: MonthlyPrices): PlanChange {
  const active = current !== "starter" && !!expiry && new Date(expiry).getTime() > now;
  if (!active) return "new";
  if (current === target) return "renew";
  // Up or down by monthly price (plans an admin adds slot in by what they cost).
  return monthly(target, prices) > monthly(current, prices) ? "upgrade" : "downgrade";
}

/** Monthly price per plan; the platform catalog's when given, else the built-in defaults. */
export type MonthlyPrices = Partial<Record<SubscriptionTier, number>>;

/** Daily value of a plan, from its monthly price. */
const monthly = (tier: SubscriptionTier, prices?: MonthlyPrices) => prices?.[tier] ?? TIERS[tier]?.priceMonthly ?? 0;
const daily = (tier: SubscriptionTier, prices?: MonthlyPrices) => monthly(tier, prices) / 30;

/**
 * Whole days of `target` that the unused part of the current plan is worth. 0 for a renewal
 * (the new period is appended to the current one instead) or when nothing paid is left.
 */
export function bonusDays(current: SubscriptionTier, expiry: string | null, target: SubscriptionTier, now = Date.now(), prices?: MonthlyPrices): number {
  const change = planChange(current, expiry, target, now, prices);
  if (change !== "upgrade" && change !== "downgrade") return 0;
  if (target === "starter" || !daily(target, prices)) return 0;
  const remainingDays = (new Date(expiry!).getTime() - now) / DAY_MS;
  return Math.floor((remainingDays * daily(current, prices)) / daily(target, prices));
}

/** New expiry after paying for `periodDays` of `target`. */
export function newExpiry(current: SubscriptionTier, expiry: string | null, target: SubscriptionTier, periodDays: number, now = Date.now(), prices?: MonthlyPrices): number {
  if (planChange(current, expiry, target, now, prices) === "renew") return new Date(expiry!).getTime() + periodDays * DAY_MS;
  return now + (periodDays + bonusDays(current, expiry, target, now, prices)) * DAY_MS;
}
