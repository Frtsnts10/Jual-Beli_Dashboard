const { getSubscriptionStatus } = require("./src/features/subscription/server/subscription-actions.ts");
const { adminDb } = require("./src/lib/firebase/server.ts");

async function check() {
  const storeId = "4lHojACGdUrNKQDhocrt";
  const snap = await adminDb.collection("subscriptions").doc(storeId).get();
  console.log("Sub doc:", snap.data());
}
check();
