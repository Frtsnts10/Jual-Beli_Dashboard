"use server";

import { xendit } from "@/lib/xendit";
import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createCheckoutSession(priceId: string, _storeCount: number) {
  const supabase = await createServerSupabase();
  const adminSupabase = await createAdminSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("id, email").eq("id", user.id).single();
  if (!profile) throw new Error("Profile not found");

  // Get or create Xendit customer
  let { data: sub } = await supabase.from("subscriptions").select("xendit_customer_id").eq("profile_id", profile.id).single();
  if (!sub) {
    const customer = await xendit.customers.create({ email: profile.email, metadata: { profile_id: profile.id } });
    await adminSupabase.from("subscriptions").insert({ profile_id: profile.id, xendit_customer_id: customer.id, plan: "free", status: "active" });
    sub = { xendit_customer_id: customer.id };
  }

  const invoice = await xendit.invoice.create({
    external_id: `inv_${Date.now()}`,
    amount: priceId === "price_mock_enterprise_tier" ? 290000 : 99000,
    payer_email: profile.email,
    description: "Shop Dashboard Subscription",
    success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard?checkout_success=true`,
    failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription`,
  });

  redirect(invoice.invoice_url!);
}

export async function createBillingPortalSession() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();
  if (!profile) throw new Error("Profile not found");

  const { data: sub } = await supabase.from("subscriptions").select("xendit_customer_id").eq("profile_id", profile.id).single();
  if (!sub?.xendit_customer_id) throw new Error("No customer");

  // Mocking Xendit Subscription Management Portal redirect
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/subscription`;

  redirect(portalUrl);
}