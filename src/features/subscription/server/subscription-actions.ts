"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { stripe, STRIPE_PREMIUM_PLAN_PRICE_ID } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function getSubscriptionStatus(storeId: string) {
  const supabase = await createServerSupabase();
  const { data: userRes } = await supabase.auth.getUser();
  const email = userRes.user?.email || "";

  // Support pre-authorized accounts whitelist bypass to map core administrative users to premium tier natively
  let isPreAuthorizedPro = 
    !!(process.env.PREAUTHORIZED_PRO_EMAILS?.includes(email));

  // Check the profiles table for database-controlled is_premium toggle
  if (userRes.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userRes.user.id)
      .single();

    if (profile?.is_premium) {
      isPreAuthorizedPro = true;
    }
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("store_id", storeId)
    .single();

  if (isPreAuthorizedPro) {
    return {
      isSubscribed: true,
      plan: "Shop Dashboard Pro",
      status: "Pre-Authorized Master Account",
      currentPeriodEnd: null,
    };
  }

  if (!data) {
    return {
      isSubscribed: false,
      plan: "free",
      status: "inactive",
      currentPeriodEnd: null,
    };
  }

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
    // Route cleanly to dedicated Stripe Checkout Simulation Vector
    return { url: `/checkout/${storeId}?interval=${interval}` };
  } catch (error: any) {
    return { error: error.message || "Failed to instantiate Stripe session vector" };
  }
}
