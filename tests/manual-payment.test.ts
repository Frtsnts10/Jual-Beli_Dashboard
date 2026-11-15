// Requires the Firestore emulator: `npm run test:emulator` (CI) or FIRESTORE_EMULATOR_HOST set.
import { beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { expireUnpaidOrders, failOrder } from "@/lib/payments/manual";

const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = emulator ? describe : describe.skip;

async function clear() {
  const res = await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/web-store-dashboard/databases/(default)/documents`, { method: "DELETE" });
  if (!res.ok) throw new Error(`emulator clear failed: ${res.status}`);
}
const get = async (col: string, id: string) => (await adminDb.collection(col).doc(id).get()).data()!;
const minutes = (n: number) => Timestamp.fromMillis(Date.now() + n * 60_000);

async function order(id: string, extra: Record<string, unknown> = {}) {
  await adminDb.collection("orders").doc(id).set({ store_id: "s1", product_id: "p1", amount: 45023, payment_status: "PENDING", voucher_code: null, pay_by: minutes(60), proof_uploaded_at: null, ...extra });
}

d("manual QRIS payments", () => {
  beforeEach(clear);

  it("rejecting frees the voucher use exactly once", async () => {
    await adminDb.collection("vouchers").doc("s1_HEMAT10").set({ store_id: "s1", code: "HEMAT10", used_count: 3 });
    await order("ORD-1", { voucher_code: "HEMAT10" });
    expect(await failOrder("ORD-1", "Dana tidak masuk")).toBe(true);
    expect(await failOrder("ORD-1", "Dana tidak masuk")).toBe(false);
    const o = await get("orders", "ORD-1");
    expect(o.payment_status).toBe("FAILED");
    expect(o.rejected_reason).toBe("Dana tidak masuk");
    expect((await get("vouchers", "s1_HEMAT10")).used_count).toBe(2);
  });

  it("expires overdue orders without proof, keeps the ones with proof or still in time", async () => {
    await order("ORD-LATE", { pay_by: minutes(-5) });
    await order("ORD-PROOF", { pay_by: minutes(-5), proof_uploaded_at: minutes(-10) });
    await order("ORD-OK", { pay_by: minutes(30) });
    await order("ORD-OTHER", { store_id: "s2", pay_by: minutes(-5) });
    expect(await expireUnpaidOrders("s1")).toBe(1);
    expect((await get("orders", "ORD-LATE")).payment_status).toBe("FAILED");
    expect((await get("orders", "ORD-PROOF")).payment_status).toBe("PENDING");
    expect((await get("orders", "ORD-OK")).payment_status).toBe("PENDING");
    expect((await get("orders", "ORD-OTHER")).payment_status).toBe("PENDING");
    expect(await expireUnpaidOrders()).toBe(1);
    expect((await get("orders", "ORD-OTHER")).payment_status).toBe("FAILED");
  });
});
