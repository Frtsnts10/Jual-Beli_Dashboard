import { timingSafeEqual } from "node:crypto";
import { after, NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { fulfillOrder } from "@/lib/fulfillment";
import { deliverOrder } from "@/lib/automation";
import { applySubscriptionPayment } from "@/lib/subscriptions";

// Xendit Invoice callback. Configure in Xendit Dashboard → Settings → Webhooks →
// "Invoices paid", pointing at https://<dashboard-domain>/api/webhooks/xendit.
// Handles both storefront orders (external_id ORD-…) and plan purchases (SUB-…).
// Invoices created on behalf of a seller's sub-account (for-user-id) are reported to
// the platform (master) account's callback URL with the master's verification token.
// Xendit authenticates callbacks with the account's verification token, sent in the
// x-callback-token header; it must equal XENDIT_WEBHOOK_TOKEN.

interface InvoiceCallback {
  id: string;
  external_id: string;
  status: "PAID" | "SETTLED" | "EXPIRED" | string;
  amount?: number;
  paid_amount?: number;
}

function validToken(received: string | null) {
  const expected = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!validToken(req.headers.get("x-callback-token"))) {
    return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
  }

  const body = (await req.json()) as InvoiceCallback;

  if (body?.external_id?.startsWith("SUB-")) {
    if (body.status === "PAID" || body.status === "SETTLED") {
      const result = await applySubscriptionPayment(body.external_id, body.id, body.paid_amount ?? body.amount ?? -1);
      const status = result === "not_found" ? 404 : result.endsWith("mismatch") ? 400 : 200;
      return NextResponse.json({ ok: status === 200, result }, { status });
    }
    if (body.status === "EXPIRED") {
      const ref = adminDb.collection("subscription_payments").doc(body.external_id);
      await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (snap.exists && snap.get("status") === "PENDING") tx.update(ref, { status: "EXPIRED" });
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (!body?.external_id?.startsWith("ORD-")) {
    return NextResponse.json({ ok: true, ignored: "unknown invoice" });
  }

  const orderRef = adminDb.collection("orders").doc(body.external_id);
  const order = await orderRef.get();
  if (!order.exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // The invoice must be the one this order created, for the amount the order expects.
  const expectedInvoice = order.get("xendit_invoice_id");
  if (expectedInvoice && expectedInvoice !== body.id) {
    return NextResponse.json({ error: "Invoice mismatch" }, { status: 400 });
  }

  if (body.status === "PAID" || body.status === "SETTLED") {
    const paid = body.paid_amount ?? body.amount;
    if (paid !== order.get("amount")) {
      console.error(`Amount mismatch on ${body.external_id}: paid ${paid}, expected ${order.get("amount")}`);
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }
    const result = await fulfillOrder(body.external_id, { invoiceId: body.id });
    // Pro/Ultimate: push the account to the buyer's WhatsApp via n8n, after acknowledging Xendit.
    if (result === "fulfilled") after(() => deliverOrder(body.external_id, "paid"));
    return NextResponse.json({ ok: true, result });
  }

  if (body.status === "EXPIRED" && order.get("payment_status") === "PENDING") {
    await orderRef.update({ payment_status: "FAILED" });
  }
  return NextResponse.json({ ok: true });
}
