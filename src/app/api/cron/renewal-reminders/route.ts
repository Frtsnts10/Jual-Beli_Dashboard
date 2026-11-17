import { NextRequest, NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { remindRenewal } from "@/lib/integrations/automation";
import { storefrontUrl } from "@/lib/store-url";
import { expireUnpaidOrders, pruneOldProofs } from "@/lib/payments/manual";
import { notifyExpiringPlans } from "@/lib/billing/expiry-notice";

// Auto-renewal reminders (Pro & Ultimate, plan §3) + expiry of unpaid QRIS orders:
// once a day, message buyers whose
// account access ends within 3 days. Scheduled in vercel.json; Vercel Cron sends
// "Authorization: Bearer $CRON_SECRET". renewal_notified prevents duplicate messages.

const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const due = await adminDb
    .collection("orders")
    .where("payment_status", "==", "PAID")
    .where("renewal_notified", "==", false)
    .where("access_expires_at", ">=", Timestamp.fromMillis(now))
    .where("access_expires_at", "<=", Timestamp.fromMillis(now + WINDOW_MS))
    .limit(500)
    .get();

  const stores = new Map<string, string>();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const order of due.docs) {
    try {
      const storeId = order.get("store_id") as string;
      if (!stores.has(storeId)) {
        const store = await adminDb.collection("stores").doc(storeId).get();
        stores.set(
          storeId,
          storefrontUrl({
            slug: store.get("slug"),
            custom_domain: store.get("custom_domain") ?? null,
            custom_domain_status: store.get("custom_domain_status") ?? null,
          }),
        );
      }
      const link = `${stores.get(storeId)}/checkout/${order.get("product_id")}`;
      if (await remindRenewal(order.id, link)) sent++;
      else skipped++;
    } catch (err) {
      failed++;
      console.error(`Renewal reminder failed for ${order.id}:`, err);
    }
  }
  // Nightly housekeeping: QRIS orders never paid (no proof by their pay-by time) fail, so
  // their voucher uses come back even in stores whose seller didn't open Pesanan.
  const expired = await expireUnpaidOrders();
  const proofsPruned = await pruneOldProofs();
  const planNotices = await notifyExpiringPlans().catch(
    (err) => (console.error("plan expiry notices failed", err), -1),
  );
  return NextResponse.json({
    due: due.size,
    sent,
    skipped,
    failed,
    expired,
    proofsPruned,
    planNotices,
  });
}
