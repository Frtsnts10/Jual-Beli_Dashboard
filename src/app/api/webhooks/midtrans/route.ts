import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Verify Midtrans Signature Key
    if (process.env.MIDTRANS_SERVER_KEY) {
      const orderId = payload.order_id;
      const statusCode = payload.status_code;
      const grossAmount = payload.gross_amount;
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      
      const signatureKey = crypto.createHash('sha512').update(orderId + statusCode + grossAmount + serverKey).digest('hex');
      
      if (signatureKey !== payload.signature_key) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
      }
    }

    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    // Extract custom fields injected during snap generation
    const profileId = payload.custom_field1;
    const interval = payload.custom_field2;
    const planName = payload.custom_field3 || `Shop Dashboard Pro`;

    if (!profileId) {
      return NextResponse.json({ error: "Missing metadata (custom_field1 for profileId)" }, { status: 400 });
    }

    if (
      transactionStatus == 'capture' || 
      transactionStatus == 'settlement'
    ) {
      if (fraudStatus == 'challenge') {
        // Handle fraud challenge if necessary, but usually we just log
        console.log("Transaction challenged by FDS");
      } else {
        // Calculate current period end based on interval
        const now = new Date();
        let periodEnd = new Date();
        if (interval === "weekly") periodEnd.setDate(now.getDate() + 7);
        else if (interval === "monthly") periodEnd.setMonth(now.getMonth() + 1);
        else if (interval === "yearly") periodEnd.setFullYear(now.getFullYear() + 1);
        else if (interval === "lifetime") periodEnd.setFullYear(now.getFullYear() + 100);
        else periodEnd.setMonth(now.getMonth() + 1);

        // Create or update subscription record bound to the User Profile
        await adminDb.collection("subscriptions").doc(profileId).set({
          profile_id: profileId,
          plan: planName.toLowerCase().includes("test") ? "test" : planName.toLowerCase().includes("plus") ? "plus" : "pro",
          plan_name: planName,
          status: "active",
          interval: interval || "monthly",
          current_period_end: periodEnd.getTime(),
          updated_at: now.getTime(),
          midtrans_order_id: payload.order_id,
          midtrans_transaction_id: payload.transaction_id
        }, { merge: true });
      }
    } else if (
      transactionStatus == 'cancel' ||
      transactionStatus == 'deny' ||
      transactionStatus == 'expire'
    ) {
      console.log(`Transaction ${payload.order_id} failed or expired`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Midtrans Webhook Error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
