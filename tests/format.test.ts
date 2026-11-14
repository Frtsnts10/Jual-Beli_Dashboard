import { describe, expect, it } from "vitest";
import { formatDate, formatIDR } from "@/lib/utils";

describe("formatIDR", () => {
  it.each([
    [0, "Rp 0"],
    [999, "Rp 999"],
    [99_000, "Rp 99.000"],
    [1_234_567, "Rp 1.234.567"],
    [-15_000, "-Rp 15.000"],
    [2490.6, "Rp 2.491"],
    [Number.NaN, "Rp 0"],
  ])("%s → %s", (value, expected) => {
    expect(formatIDR(value)).toBe(expected);
  });
});

describe("formatDate", () => {
  it("renders in Jakarta time regardless of the machine's zone", () => {
    // 17:30 UTC on 14 Nov = 00:30 WIB on 15 Nov
    expect(formatDate("2026-11-14T17:30:00Z")).toBe("15 Nov 2026");
    expect(formatDate("2026-11-14T17:30:00Z", true)).toBe("15 Nov 2026 00.30");
    expect(formatDate("2026-05-03T01:05:00Z", true)).toBe("3 Mei 2026 08.05");
  });

  it("returns a dash for missing or invalid input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("not a date")).toBe("—");
  });
});
