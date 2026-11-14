import { describe, expect, it } from "vitest";
import { evaluateVoucher, normaliseCode, type Voucher } from "@/lib/voucher";

const base: Voucher = {
  store_id: "s1",
  code: "HEMAT10",
  type: "percent",
  value: 10,
  max_discount: null,
  min_amount: 0,
  max_uses: null,
  used_count: 0,
  expires_at: null,
  product_ids: null,
  active: true,
};
const order = { storeId: "s1", productId: "p1", amount: 50_000 };
const now = new Date("2026-11-15T00:00:00Z");

describe("evaluateVoucher", () => {
  it("applies percent and fixed discounts", () => {
    expect(evaluateVoucher(base, order, now)).toEqual({ ok: true, discount: 5_000, total: 45_000 });
    expect(evaluateVoucher({ ...base, type: "fixed", value: 7_500 }, order, now)).toEqual({ ok: true, discount: 7_500, total: 42_500 });
  });

  it("caps percent discounts and never goes below the payable minimum", () => {
    expect(evaluateVoucher({ ...base, value: 50, max_discount: 10_000 }, order, now)).toMatchObject({ discount: 10_000 });
    expect(evaluateVoucher({ ...base, type: "fixed", value: 80_000 }, order, now)).toEqual({ ok: true, discount: 49_000, total: 1_000 });
    expect(evaluateVoucher({ ...base, value: 100 }, { ...order, amount: 1_000 }, now)).toMatchObject({ ok: false });
  });

  it("enforces minimum spend, quota, expiry, products, store and active flag", () => {
    expect(evaluateVoucher({ ...base, min_amount: 60_000 }, order, now)).toMatchObject({ ok: false, error: expect.stringContaining("Minimal belanja Rp 60.000") });
    expect(evaluateVoucher({ ...base, max_uses: 3, used_count: 3 }, order, now)).toMatchObject({ ok: false, error: expect.stringContaining("Kuota") });
    expect(evaluateVoucher({ ...base, max_uses: 3, used_count: 2 }, order, now)).toMatchObject({ ok: true });
    expect(evaluateVoucher({ ...base, expires_at: "2026-11-14T23:59:59Z" }, order, now)).toMatchObject({ ok: false, error: expect.stringContaining("kedaluwarsa") });
    expect(evaluateVoucher({ ...base, expires_at: "2026-11-16T00:00:00Z" }, order, now)).toMatchObject({ ok: true });
    expect(evaluateVoucher({ ...base, product_ids: ["p2"] }, order, now)).toMatchObject({ ok: false, error: expect.stringContaining("produk") });
    expect(evaluateVoucher({ ...base, store_id: "other" }, order, now)).toMatchObject({ ok: false });
    expect(evaluateVoucher({ ...base, active: false }, order, now)).toMatchObject({ ok: false });
    expect(evaluateVoucher(null, order, now)).toMatchObject({ ok: false });
  });

  it("normalises codes", () => {
    expect(normaliseCode(" hemat 10 ")).toBe("HEMAT10");
  });
});
