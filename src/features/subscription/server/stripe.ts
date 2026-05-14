"use server";

import { stripe } from "@/lib/stripe";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCheckoutSession(priceId: string, storeCount: number) {
  const supabase = await createServerSupabase();
  const adminSupabase = await createAdminSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("id, email").eq("id", user.id).single();
  if (!profile) throw new Error("Profile not found");

  // Get or create Stripe customer
  let { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("profile_id", profile.id).single();
  if (!sub) {
    const customer = await stripe.customers.create({ email: profile.email, metadata: { profile_id: profile.id } });
    await adminSupabase.from("subscriptions").insert({ profile_id: profile.id, stripe_customer_id: customer.id, plan: "free", status: "active" });
    sub = { stripe_customer_id: customer.id };
  }

  const session = await stripe.checkout.sessions.create({
    customer: sub.stripe_customer_id,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?checkout_success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription`,
    metadata: { profile_id: profile.id, store_count: storeCount },
  });

  redirect(session.url!);
}

export async function createBillingPortalSession() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  if (!profile) throw new Error("Profile not found");

  const { data: sub } = await supabase.from("subscriptions").select("stripe_customer_id").eq("profile_id", profile.id).single();
  if (!sub?.stripe_customer_id) throw new Error("No customer");

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription`,
  });

  redirect(portal.url);
}