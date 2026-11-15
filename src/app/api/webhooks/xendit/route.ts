import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { applySubscriptionPayment } from "@/lib/payments/subscriptions";

// Xendit Invoice callback. Configure in Xendit Dashboard → Settings → Webhooks →
// "Invoices paid", pointing at https://<dashboard-domain>/api/webhooks/xendit.
// Only plan purchases (external_id SUB-…) use Xendit; store orders are paid by QRIS.
// Xendit authenticates callbacks with the account's verification token, sent in the
// x-callback-token header; it must equal XENDIT_WEBHOOK_TOKEN.

interface InvoiceCallback {
  id: string;
  external_id: string;
  status: "PAID" | "SETTLED" | "EXPIRED" | string;
  amount?: number;
  paid_amount?: number;
  /** e.g. QRIS, OVO, DANA — the channel the buyer actually paid with. */
  payment_channel?: string;
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

  // Store orders are paid to each seller's own QRIS and confirmed in the dashboard;
  // only plan purchases still come through Xendit.
  return NextResponse.json({ ok: true, ignored: "not a plan purchase" });
}
