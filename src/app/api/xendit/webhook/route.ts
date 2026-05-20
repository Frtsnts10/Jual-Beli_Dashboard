import { NextRequest, NextResponse } from "next/server";
import { xendit } from "@/lib/xendit";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("x-callback-token") || "";
  let event: Record<string, unknown>;

  try {
    event = xendit.webhooks.constructEvent(payload, sig, process.env.XENDIT_WEBHOOK_SECRET || "whsec_mock");
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 400 });
  }

  const adminSupabase = await createAdminSupabase();

  if (event.event === "invoice.paid") {
    const invoice = event.data as Record<string, unknown>;
    const customer = (await xendit.customers.retrieve(invoice.customer_id as string)) as { metadata?: { profile_id?: string } };
    const profileId = (invoice.metadata as Record<string, string>)?.profile_id || customer?.metadata?.profile_id;
    if (!profileId) return NextResponse.json({ error: "No profile id" }, { status: 400 });

    const plan = (invoice.items as Array<{ name: string }>)?.[0]?.name ?? "starter";
    const storeId = (invoice.metadata as Record<string, string>)?.store_id || null;

    const upsertPayload: Record<string, unknown> = {
      profile_id: profileId,
      xendit_subscription_id: invoice.id,
      plan,
      plan_name: plan,
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    };

    if (storeId) {
      upsertPayload.store_id = storeId;
    }

    await adminSupabase.from("subscriptions").upsert(upsertPayload);
  } else if (event.event === "invoice.expired") {
    const invoice = event.data as Record<string, unknown>;
    const { data } = await adminSupabase.from("subscriptions").select("profile_id").eq("xendit_subscription_id", invoice.id).single();
    if (data) {
      await adminSupabase.from("subscriptions").update({ plan: "free", status: "canceled", xendit_subscription_id: null }).eq("profile_id", data.profile_id);
    }
  }

  return NextResponse.json({ received: true });
}