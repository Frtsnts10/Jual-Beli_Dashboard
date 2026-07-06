"use server";

import { adminDb, getAuthenticatedUser } from "@/lib/firebase/server";

export async function getSubscriptionStatus() {
  const user = await getAuthenticatedUser();
  const email = user?.email || "";
  const uid = user?.uid;

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
  const subsSnap = await adminDb
    .collection("subscriptions")
    .where("profile_id", "==", uid)
    .where("status", "in", ["active", "trialing"])
    .limit(1)
    .get();

  if (isPreAuthorizedPro) {
    return {
      isSubscribed: true,
      plan: "Shop Dashboard Pro",
      tier: "pro",
      status: "Pre-Authorized Master Account",
      interval: "lifetime",
      currentPeriodEnd: null,
    };
  }

  if (subsSnap.empty) {
    return {
      isSubscribed: false,
      plan: "free",
      tier: "free",
      status: "inactive",
      interval: "none",
      currentPeriodEnd: null,
    };
  }

  const data = subsSnap.docs[0].data();
  const isSubscribed = data.status === "active" || data.status === "trialing";

  return {
    isSubscribed,
    plan: data.plan_name,
    tier: data.plan || "pro", // Fallback to pro if missing
    status: data.status,
    interval: data.interval || "monthly",
    currentPeriodEnd: data.current_period_end,
  };
}

// @ts-expect-error missing types for midtrans
import * as midtransClient from "midtrans-client";

export async function createCheckoutSessionAction(
  storeId: string, 
  returnUrl: string, 
  interval: string = "monthly",
  tier: "plus" | "pro" | "test" = "pro"
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { error: "User not authenticated" };
    }

    if (!process.env.MIDTRANS_SERVER_KEY) {
      return { error: "MIDTRANS_SERVER_KEY is not configured" };
    }

    // Determine amount based on interval and IDR pricing
    let amount = 0;
    if (tier === "test") amount = 1;
    else if (interval === "weekly") amount = 9 * 15000;
    else if (interval === "monthly") amount = 29 * 15000;
    else if (interval === "yearly") amount = 59 * 15000;
    else if (interval === "lifetime") amount = 99 * 15000;
    else amount = 29 * 15000;

    // Create Snap API instance
    const serverKey = process.env.MIDTRANS_SERVER_KEY.trim();
    const snap = new midtransClient.Snap({
      // We explicitly set this to false for testing.
      // Do not rely on SB- prefix since some sandbox keys don't have it.
      isProduction: process.env.NODE_ENV === "production" ? true : false,
      serverKey: serverKey
    });

    const orderId = `sub_${user.uid}_${Date.now()}`;

    const parameter = {
      "transaction_details": {
        "order_id": orderId,
        "gross_amount": amount
      },
      "credit_card":{
        "secure" : true
      },
      "customer_details": {
        "email": user.email || "customer@example.com",
      },
      "callbacks": {
        "finish": `${returnUrl}?payment_success=true`,
        "error": `${returnUrl}?payment_success=false`,
        "unfinish": `${returnUrl}?payment_success=false`
      },
      "custom_field1": user.uid,
      "custom_field2": interval,
      "custom_field3": tier === "test" ? `Test Tier (1 Rupiah)` : tier === "plus" ? `Shop Dashboard Plus (${interval})` : `Shop Dashboard Pro (${interval})`
    };

    const transaction = await snap.createTransaction(parameter);

    return { url: transaction.redirect_url };
  } catch (error: unknown) {
    console.error("Midtrans Error:", error);
    if (error instanceof Error) {
      return { error: error.message || "Failed to instantiate Midtrans session" };
    }
    return { error: "Failed to instantiate Midtrans session" };
  }
}
