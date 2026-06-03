"use server";

import { adminDb, getAuthenticatedUser } from "@/lib/firebase/server";

export async function getSubscriptionStatus(storeId: string) {
  const user = await getAuthenticatedUser();
  const email = user?.email || "";

  let isPreAuthorizedPro = 
    !!(process.env.PREAUTHORIZED_PRO_EMAILS?.includes(email));

  // Check the profiles collection for database-controlled is_premium toggle
  if (user?.uid) {
    const profileDoc = await adminDb.collection("profiles").doc(user.uid).get();
    if (profileDoc.exists && profileDoc.data()?.is_premium) {
      isPreAuthorizedPro = true;
    }
  }

  // Check subscriptions
  const subsSnap = await adminDb.collection("subscriptions")
    .where("store_id", "==", storeId)
    .limit(1)
    .get();

  if (isPreAuthorizedPro) {
    return {
      isSubscribed: true,
      plan: "Shop Dashboard Pro",
      status: "Pre-Authorized Master Account",
      currentPeriodEnd: null,
    };
  }

  if (subsSnap.empty) {
    return {
      isSubscribed: false,
      plan: "free",
      status: "inactive",
      currentPeriodEnd: null,
    };
  }

  const data = subsSnap.docs[0].data();
  const isSubscribed = data.status === "active" || data.status === "trialing";

  return {
    isSubscribed,
    plan: data.plan_name,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
  };
}

export async function createCheckoutSessionAction(storeId: string, returnUrl: string, interval: string = "monthly") {
  try {
    return { url: `/checkout/${storeId}?interval=${interval}` };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { error: error.message || "Failed to instantiate Xendit session vector" };
    }
    return { error: "Failed to instantiate Xendit session vector" };
  }
}
