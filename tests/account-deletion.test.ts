// Requires the Firestore emulator: `npm run test:emulator` (CI) or FIRESTORE_EMULATOR_HOST set.
// Uses a buyer who is also a seller, so the (Auth-emulator-only) login deletion is skipped.
import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { deleteCustomerAccount } from "@/lib/customers/account-deletion";

const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
const d = emulator ? describe : describe.skip;

async function clear() {
  const res = await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/web-store-dashboard/databases/(default)/documents`, { method: "DELETE" });
  if (!res.ok) throw new Error(`emulator clear failed: ${res.status}`);
}
const get = async (col: string, id: string) => (await adminDb.collection(col).doc(id).get()).data();

d("approved account deletion", () => {
  beforeEach(clear);

  it("removes the buyer profile and request, keeps orders unlinked and reviews anonymous", async () => {
    await adminDb.collection("users").doc("u1").set({ email: "a@b.c" }); // also a seller
    await adminDb.collection("customers").doc("u1").set({ email: "a@b.c", name: "Andi" });
    await adminDb.collection("account_deletion_requests").doc("u1").set({ uid: "u1", status: "PENDING" });
    await adminDb.collection("orders").doc("ORD-1").set({ store_id: "s1", customer_uid: "u1", amount: 1000 });
    await adminDb.collection("orders").doc("ORD-2").set({ store_id: "s1", customer_uid: "u2", amount: 1000 });
    await adminDb.collection("reviews").doc("ORD-1").set({ customer_uid: "u1", name: "Andi P.", rating: 5 });

    expect(await deleteCustomerAccount("u1")).toEqual({ loginDeleted: false });
    expect(await get("customers", "u1")).toBeUndefined();
    expect(await get("account_deletion_requests", "u1")).toBeUndefined();
    expect(await get("users", "u1")).toBeDefined(); // seller login/profile untouched
    expect(await get("orders", "ORD-1")).toEqual({ store_id: "s1", amount: 1000 });
    expect((await get("orders", "ORD-2"))?.customer_uid).toBe("u2");
    expect(await get("reviews", "ORD-1")).toMatchObject({ customer_uid: null, name: "Pembeli", rating: 5 });
  });
});
