import { NextResponse } from "next/server";
import { xendit } from "@/lib/xendit";
import { adminDb } from "@/lib/firebase/server";

export async function POST(req: Request) {
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

  if (event.event === "invoice.paid") {
    const invoice = event.data as Record<string, unknown>;
    const customer = (await xendit.customers.retrieve(invoice.customer_id as string)) as { metadata?: { profile_id?: string } };
    const profileId = (invoice.metadata as Record<string, string>)?.profile_id || customer?.metadata?.profile_id;
    if (!profileId) return NextResponse.json({ error: "No profile id" }, { status: 400 });

    const plan = (invoice.items as Array<{ name: string }>)?.[0]?.name ?? "starter";
    const storeId = (invoice.metadata as Record<string, string>)?.store_id || null;

    const subsRef = adminDb.collection("subscriptions").doc(profileId);
    const upsertData: Record<string, unknown> = {
      profile_id: profileId,
      xendit_subscription_id: invoice.id,
      plan,
      plan_name: plan,
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 86400 * 1000).toISOString(),
    };

    if (storeId) upsertData.store_id = storeId;

    await subsRef.set(upsertData, { merge: true });
  } else if (event.event === "invoice.expired") {
    const invoice = event.data as Record<string, unknown>;
    // Find subscription by xendit_subscription_id
    const subsSnap = await adminDb.collection("subscriptions")
      .where("xendit_subscription_id", "==", invoice.id)
      .limit(1)
      .get();

    if (!subsSnap.empty) {
      await subsSnap.docs[0].ref.update({
        plan: "free",
        status: "canceled",
        xendit_subscription_id: null,
      });
    }
  }

  return NextResponse.json({ received: true });
}