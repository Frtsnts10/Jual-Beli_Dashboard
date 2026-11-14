// Requires the Firestore emulator: `npm run test:emulator` (CI) or FIRESTORE_EMULATOR_HOST set.
import { beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { fulfillOrder, replaceCredential } from "@/lib/payments/fulfillment";

const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = emulator ? describe : describe.skip;

async function clear() {
  const res = await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/web-store-dashboard/databases/(default)/documents`, { method: "DELETE" });
  if (!res.ok) throw new Error(`emulator clear failed: ${res.status}`);
}

async function product(id: string, extra: Record<string, unknown> = {}) {
  await adminDb.collection("products").doc(id).set({ store_id: "s1", title: id, price: 10000, duration_days: 30, stock_available: 0, ...extra });
}

async function stock(productId: string, n: number) {
  for (let i = 0; i < n; i++) {
    await adminDb.collection("credentials_vault").add({ store_id: "s1", product_id: productId, account_email: `${productId}${i}@x.com`, account_password: "p", profile_pin: "", status: "AVAILABLE", expiry_date: null });
  }
  await adminDb.collection("products").doc(productId).update({ stock_available: n });
}

async function order(id: string, productId: string) {
  await adminDb.collection("orders").doc(id).set({ store_id: "s1", product_id: productId, amount: 10000, payment_status: "PENDING", credential_id: null, paid_at: null });
}

const get = async (col: string, id: string) => (await adminDb.collection(col).doc(id).get()).data()!;

d("fulfillOrder", () => {
  beforeEach(clear);

  it("allocates one credential, decrements stock and sets the access period", async () => {
    await product("p1");
    await stock("p1", 2);
    await order("ORD-1", "p1");
    expect(await fulfillOrder("ORD-1", { invoiceId: "inv_1" })).toBe("fulfilled");

    const o = await get("orders", "ORD-1");
    expect(o.payment_status).toBe("PAID");
    expect(o.credential_ids).toHaveLength(1);
    expect(o.xendit_invoice_id).toBe("inv_1");
    const days = (o.access_expires_at.toMillis() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29.9);
    expect((await get("credentials_vault", o.credential_id)).status).toBe("SOLD");
    expect((await get("products", "p1")).stock_available).toBe(1);
  });

  it("is idempotent for retried webhooks", async () => {
    await product("p1");
    await stock("p1", 2);
    await order("ORD-1", "p1");
    await fulfillOrder("ORD-1");
    expect(await fulfillOrder("ORD-1")).toBe("already_fulfilled");
    expect((await get("products", "p1")).stock_available).toBe(1);
  });

  it("flags needs_stock, then allocates after a restock", async () => {
    await product("p1");
    await order("ORD-1", "p1");
    expect(await fulfillOrder("ORD-1")).toBe("needs_stock");
    expect((await get("orders", "ORD-1")).needs_stock).toBe(true);
    await stock("p1", 1);
    expect(await fulfillOrder("ORD-1")).toBe("fulfilled");
    expect((await get("orders", "ORD-1")).needs_stock).toBe(false);
  });

  it("uses the credential's own expiry when it has one", async () => {
    await product("p1");
    const expiry = Timestamp.fromDate(new Date("2030-01-01T00:00:00Z"));
    await adminDb.collection("credentials_vault").add({ store_id: "s1", product_id: "p1", account_email: "a@x", account_password: "p", status: "AVAILABLE", expiry_date: expiry });
    await order("ORD-1", "p1");
    await fulfillOrder("ORD-1");
    expect((await get("orders", "ORD-1")).access_expires_at.toMillis()).toBe(expiry.toMillis());
  });

  it("never hands the same account to two concurrent orders", async () => {
    await product("p1");
    await stock("p1", 3);
    const ids = ["ORD-A", "ORD-B", "ORD-C", "ORD-D", "ORD-E"];
    for (const id of ids) await order(id, "p1");
    const results = await Promise.all(ids.map((id) => fulfillOrder(id)));

    expect(results.filter((r) => r === "fulfilled")).toHaveLength(3);
    expect(results.filter((r) => r === "needs_stock")).toHaveLength(2);
    const creds = (await Promise.all(ids.map((id) => get("orders", id)))).map((o) => o.credential_id).filter(Boolean);
    expect(new Set(creds).size).toBe(3);
    expect((await get("products", "p1")).stock_available).toBe(0);
  });

  it("fulfils a bundle with one account per component, all or nothing", async () => {
    await product("nf");
    await product("sp");
    await product("bundle", { bundle_items: ["nf", "sp"] });
    await stock("nf", 2);
    await order("ORD-1", "bundle");
    expect(await fulfillOrder("ORD-1")).toBe("needs_stock"); // Spotify empty: nothing taken
    expect((await get("products", "nf")).stock_available).toBe(2);

    await stock("sp", 1);
    expect(await fulfillOrder("ORD-1")).toBe("fulfilled");
    const o = await get("orders", "ORD-1");
    expect(o.credential_ids).toHaveLength(2);
    const products = await Promise.all(o.credential_ids.map(async (id: string) => (await get("credentials_vault", id)).product_id));
    expect(products.sort()).toEqual(["nf", "sp"]);
  });
});

d("replaceCredential", () => {
  beforeEach(clear);

  it("retires the old account and keeps the original access period", async () => {
    await product("p1");
    await stock("p1", 2);
    await order("ORD-1", "p1");
    await fulfillOrder("ORD-1");
    const before = await get("orders", "ORD-1");

    expect(await replaceCredential("ORD-1")).toBe("replaced");
    const after = await get("orders", "ORD-1");
    expect(after.credential_id).not.toBe(before.credential_id);
    expect(after.warranty_status).toBe("REPLACED");
    expect((await get("credentials_vault", before.credential_id)).status).toBe("EXPIRED");
    expect((await get("credentials_vault", after.credential_id)).expiry_date.toMillis()).toBe(before.access_expires_at.toMillis());
    expect(await replaceCredential("ORD-1")).toBe("needs_stock");
  });

  it("refuses unpaid orders", async () => {
    await product("p1");
    await order("ORD-1", "p1");
    expect(await replaceCredential("ORD-1")).toBe("not_paid");
  });
});
