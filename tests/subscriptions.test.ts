// Requires the Firestore emulator: `npm run test:emulator` (CI) or FIRESTORE_EMULATOR_HOST set.
import { beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { applySubscriptionPayment, rejectSubscriptionPayment } from "@/lib/payments/subscriptions";

const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = emulator ? describe : describe.skip;
const DAY = 86_400_000;

async function clear() {
  const res = await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/web-store-dashboard/databases/(default)/documents`, { method: "DELETE" });
  if (!res.ok) throw new Error(`emulator clear failed: ${res.status}`);
}
const get = async (col: string, id: string) => (await adminDb.collection(col).doc(id).get()).data()!;

d("plan purchases (platform QRIS)", () => {
  beforeEach(clear);

  it("confirming a renewal extends the current plan, once", async () => {
    const expiry = Date.now() + 10 * DAY;
    await adminDb.collection("users").doc("u1").set({ subscription_tier: "pro", subscription_expiry: Timestamp.fromMillis(expiry) });
    await adminDb.collection("subscription_payments").doc("SUB-1").set({ uid: "u1", tier: "pro", period: "monthly", amount: 99123, status: "PENDING" });
    expect(await applySubscriptionPayment("SUB-1")).toBe("activated");
    expect(await applySubscriptionPayment("SUB-1")).toBe("already_paid");
    const u = await get("users", "u1");
    expect(Math.round((u.subscription_expiry.toMillis() - expiry) / DAY)).toBe(30);
    expect((await get("subscription_payments", "SUB-1")).status).toBe("PAID");
  });

  it("rejects only pending purchases and leaves the plan alone", async () => {
    await adminDb.collection("users").doc("u1").set({ subscription_tier: "starter", subscription_expiry: null });
    await adminDb.collection("subscription_payments").doc("SUB-2").set({ uid: "u1", tier: "ultimate", period: "yearly", amount: 2490111, status: "PENDING" });
    expect(await rejectSubscriptionPayment("SUB-2", "Dana tidak masuk")).toBe(true);
    expect(await rejectSubscriptionPayment("SUB-2", "lagi")).toBe(false);
    expect((await get("subscription_payments", "SUB-2")).status).toBe("REJECTED");
    expect((await get("users", "u1")).subscription_tier).toBe("starter");
  });

  it("downgrading converts the unused Ultimate days into extra Pro days", async () => {
    await adminDb.collection("users").doc("u1").set({ subscription_tier: "ultimate", subscription_expiry: Timestamp.fromMillis(Date.now() + 10 * DAY + 60_000) });
    await adminDb.collection("subscription_payments").doc("SUB-3").set({ uid: "u1", tier: "pro", period: "monthly", amount: 99001, status: "PENDING" });
    expect(await applySubscriptionPayment("SUB-3")).toBe("activated");
    const u = await get("users", "u1");
    expect(u.subscription_tier).toBe("pro");
    expect(Math.round((u.subscription_expiry.toMillis() - Date.now()) / DAY)).toBe(55);
  });
});
