import { describe, expect, it } from "vitest";
import { bonusDays, newExpiry, planChange } from "@/lib/billing/plan-change";

const DAY = 86_400_000;
const now = Date.UTC(2026, 10, 15);
const inDays = (n: number) => new Date(now + n * DAY).toISOString();

describe("plan changes", () => {
  it("classifies renew / upgrade / downgrade / new", () => {
    expect(planChange("pro", inDays(10), "pro", now)).toBe("renew");
    expect(planChange("pro", inDays(10), "ultimate", now)).toBe("upgrade");
    expect(planChange("ultimate", inDays(10), "pro", now)).toBe("downgrade");
    expect(planChange("starter", null, "pro", now)).toBe("new");
    expect(planChange("pro", inDays(-1), "ultimate", now)).toBe("new"); // lapsed
  });

  it("converts what's left at its rupiah value", () => {
    // 15 days of Pro (99k/30 per day) are worth ~5.96 days of Ultimate (249k/30 per day)
    expect(bonusDays("pro", inDays(15), "ultimate", now)).toBe(5);
    // 10 days of Ultimate are worth ~25.15 days of Pro
    expect(bonusDays("ultimate", inDays(10), "pro", now)).toBe(25);
    expect(bonusDays("pro", inDays(10), "pro", now)).toBe(0);
    expect(bonusDays("starter", null, "pro", now)).toBe(0);
  });

  it("computes the new expiry", () => {
    expect(newExpiry("pro", inDays(10), "pro", 30, now)).toBe(now + 40 * DAY); // appended
    expect(newExpiry("ultimate", inDays(10), "pro", 30, now)).toBe(now + 55 * DAY); // 30 + 25 bonus, from today
    expect(newExpiry("starter", null, "ultimate", 365, now)).toBe(now + 365 * DAY);
  });
});
