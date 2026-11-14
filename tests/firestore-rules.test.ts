// Requires the Firestore emulator (npm run test:emulator).
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const host = process.env.FIRESTORE_EMULATOR_HOST;
const d = host ? describe : describe.skip;

d("firestore.rules", () => {
  let env: RulesTestEnvironment;

  beforeAll(async () => {
    const [h, port] = host!.split(":");
    env = await initializeTestEnvironment({
      projectId: "web-store-4cf23",
      firestore: { rules: readFileSync("firestore.rules", "utf8"), host: h, port: Number(port) },
    });
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "users/alice"), { subscription_tier: "starter" });
      await setDoc(doc(db, "stores/s1"), { owner_uid: "alice", is_active: true, admin_uids: ["carol"] });
      await setDoc(doc(db, "stores/s2"), { owner_uid: "bob", is_active: false });
      await setDoc(doc(db, "stores/s1/private/integrations"), { wa_api_token: "secret" });
      await setDoc(doc(db, "products/p1"), { store_id: "s1", is_published: true });
      await setDoc(doc(db, "products/p2"), { store_id: "s1", is_published: false });
      await setDoc(doc(db, "credentials_vault/c1"), { store_id: "s1", status: "AVAILABLE" });
      await setDoc(doc(db, "orders/o1"), { store_id: "s1", payment_status: "PENDING" });
    });
  });
  afterAll(() => env?.cleanup());

  const anon = () => env.unauthenticatedContext().firestore();
  const as = (uid: string) => env.authenticatedContext(uid).firestore();

  it("public: reads active stores and published products only", async () => {
    await assertSucceeds(getDoc(doc(anon(), "stores/s1")));
    await assertFails(getDoc(doc(anon(), "stores/s2")));
    await assertSucceeds(getDoc(doc(anon(), "products/p1")));
    await assertFails(getDoc(doc(anon(), "products/p2")));
  });

  it("nobody reads store secrets from a browser", async () => {
    await assertFails(getDoc(doc(anon(), "stores/s1/private/integrations")));
    await assertFails(getDoc(doc(as("alice"), "stores/s1/private/integrations")));
    await assertFails(getDoc(doc(as("carol"), "stores/s1/private/integrations")));
  });

  it("vault and orders: owner and admins only", async () => {
    for (const uid of ["alice", "carol"]) {
      await assertSucceeds(getDoc(doc(as(uid), "credentials_vault/c1")));
      await assertSucceeds(getDoc(doc(as(uid), "orders/o1")));
    }
    await assertFails(getDoc(doc(anon(), "credentials_vault/c1")));
    await assertFails(getDoc(doc(as("bob"), "credentials_vault/c1")));
    await assertFails(getDoc(doc(as("bob"), "orders/o1")));
  });

  it("all writes are server-only", async () => {
    await assertFails(addDoc(collection(anon(), "orders"), { store_id: "s1", payment_status: "PENDING", amount: 1 }));
    await assertFails(updateDoc(doc(as("alice"), "orders/o1"), { payment_status: "PAID" }));
    await assertFails(updateDoc(doc(as("carol"), "orders/o1"), { payment_status: "PAID" }));
    await assertFails(updateDoc(doc(as("alice"), "users/alice"), { subscription_tier: "ultimate" }));
  });

  it("profiles are private", async () => {
    await assertSucceeds(getDoc(doc(as("alice"), "users/alice")));
    await assertFails(getDoc(doc(as("bob"), "users/alice")));
  });
});
