import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock");
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const adminSupabase = await createAdminSupabase();

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object;
    const profileId = subscription.metadata?.profile_id || ((await stripe.customers.retrieve(subscription.customer as string)) as any)?.metadata?.profile_id;
    if (!profileId) return NextResponse.json({ error: "No profile id" }, { status: 400 });

    const plan = subscription.items?.data?.[0]?.price?.lookup_key ?? "starter";
    const storeId = subscription.metadata?.store_id || null;

    const upsertPayload: any = {
      profile_id: profileId,
      stripe_subscription_id: subscription.id,
      plan,
      plan_name: plan,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    };

    if (storeId) {
      upsertPayload.store_id = storeId;
    }

    await adminSupabase.from("subscriptions").upsert(upsertPayload);
  } else if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const { data } = await adminSupabase.from("subscriptions").select("profile_id").eq("stripe_subscription_id", subscription.id).single();
    if (data) {
      await adminSupabase.from("subscriptions").update({ plan: "free", status: "canceled", stripe_subscription_id: null }).eq("profile_id", data.profile_id);
    }
  }

  return NextResponse.json({ received: true });
}