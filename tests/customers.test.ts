import { describe, expect, it } from "vitest";
import { aggregateCustomers } from "@/lib/data/customers";
import type { CustomerProfile, Order } from "@/types/schema";

let n = 0;
function order(p: Partial<Order> & { email: string; at: string }): Order {
  const { email, at, ...rest } = p;
  return {
    id: `ORD-${++n}`,
    store_id: "s1",
    product_id: "p1",
    product_title: "Netflix",
    amount: 50_000,
    credential_id: null,
    credential_ids: [],
    customer_contact: { email, phone: "+628111" },
    customer_uid: null,
    payment_status: "PAID",
    unique_code: 0,
    pay_by: null,
    proof_uploaded_at: null,
    rejected_reason: null,
    delivery_status: "SENT_VIA_WA",
    delivery_error: null,
    warranty_status: "VALID",
    warranty_claim: null,
    needs_stock: false,
    renewal_notified: false,
    referral_code: null,
    voucher_code: null,
    discount: 0,
    created_at: at,
    paid_at: at,
    access_expires_at: null,
    ...rest,
  };
}

describe("aggregateCustomers", () => {
  it("groups guests by email (case-insensitive) and sums only paid orders", () => {
    const rows = aggregateCustomers(
      [
        order({ email: "Budi@x.com", at: "2026-11-01T00:00:00Z" }),
        order({ email: "budi@x.com", at: "2026-11-02T00:00:00Z", payment_status: "PENDING" }),
        order({ email: "sari@x.com", at: "2026-11-03T00:00:00Z", warranty_status: "CLAIMED" }),
      ],
      new Map()
    );
    expect(rows.map((r) => [r.key, r.orders, r.paid_orders, r.total, r.open_claims, r.registered])).toEqual([
      ["e:sari@x.com", 1, 1, 50_000, 1, false],
      ["e:budi@x.com", 2, 1, 50_000, 0, false],
    ]);
  });

  it("merges a buyer's guest orders into their account row and prefers the profile's details", () => {
    const profiles = new Map<string, CustomerProfile>([["u1", { uid: "u1", email: "budi@x.com", name: "Budi Santoso", phone: "+628999" }]]);
    const rows = aggregateCustomers(
      [
        order({ email: "budi@x.com", at: "2026-11-01T00:00:00Z" }), // guest, before signing up
        order({ email: "budi@x.com", at: "2026-11-05T00:00:00Z", customer_uid: "u1" }),
      ],
      profiles
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: "u:u1", uid: "u1", registered: true, name: "Budi Santoso", phone: "+628999", orders: 2, total: 100_000 });
    expect(rows[0].first_order_at).toBe("2026-11-01T00:00:00Z");
    expect(rows[0].last_order_at).toBe("2026-11-05T00:00:00Z");
  });

  it("keeps an account row even when its profile was deleted, and sorts by latest order", () => {
    const rows = aggregateCustomers(
      [order({ email: "a@x.com", at: "2026-11-01T00:00:00Z", customer_uid: "gone" }), order({ email: "b@x.com", at: "2026-11-09T00:00:00Z" })],
      new Map()
    );
    expect(rows.map((r) => r.key)).toEqual(["e:b@x.com", "u:gone"]);
    expect(rows[1]).toMatchObject({ registered: true, name: "" });
  });
});
