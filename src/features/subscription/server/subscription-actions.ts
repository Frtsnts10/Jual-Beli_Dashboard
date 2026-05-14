"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { stripe, STRIPE_PREMIUM_PLAN_PRICE_ID } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function getSubscriptionStatus(storeId: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("store_id", storeId)
    .single();

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

export async function createCheckoutSessionAction(storeId: string, returnUrl: string) {
  try {
    const supabase = await createServerSupabase();
    // Resolve store mapping
    const { data: store } = await supabase.from("stores").select("name, owner_id").eq("id", storeId).single();

    // Trigger actual checkout session creation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: STRIPE_PREMIUM_PLAN_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          store_id: storeId,
          profile_id: store?.owner_id || "",
        },
      },
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: {
        storeId,
        profile_id: store?.owner_id || "",
      },
      client_reference_id: storeId,
    });

    return { url: session.url };
  } catch (error: any) {
    return { error: error.message || "Failed to instantiate Stripe session vector" };
  }
}
