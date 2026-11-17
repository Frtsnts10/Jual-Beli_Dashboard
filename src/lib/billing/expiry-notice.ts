import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { notify } from "@/lib/notify";
import { TIERS } from "@/config/tiers";
import type { SubscriptionTier } from "@/types/schema";

const WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Daily: sellers whose paid plan ends within 3 days get one bell + push notice per expiry date
 * (plan_expiry_notified holds the expiry it was sent for, so a renewal re-arms it).
 */
export async function notifyExpiringPlans(now = Date.now()): Promise<number> {
  const snap = await adminDb
    .collection("users")
    .where("subscription_expiry", ">=", Timestamp.fromMillis(now))
    .where("subscription_expiry", "<=", Timestamp.fromMillis(now + WINDOW_MS))
    .limit(500)
    .get();
  let sent = 0;
  for (const u of snap.docs) {
    const tier = u.get("subscription_tier") as SubscriptionTier;
    const expiry = u.get("subscription_expiry") as Timestamp;
    if (
      !tier ||
      tier === "starter" ||
      u.get("plan_expiry_notified")?.toMillis?.() === expiry.toMillis()
    )
      continue;
    const days = Math.max(1, Math.ceil((expiry.toMillis() - now) / 86_400_000));
    const store = await adminDb
      .collection("stores")
      .where("owner_uid", "==", u.id)
      .limit(1)
      .get();
    await notify([u.id], {
      type: "plan_expiring",
      title: `Paket ${TIERS[tier]?.name ?? tier} berakhir ${days} hari lagi`,
      body: "Perpanjang sekarang supaya fitur toko tidak turun ke Starter.",
      href: store.empty ? "/dashboard" : `/${store.docs[0].id}/billing`,
    });
    await u.ref.update({ plan_expiry_notified: expiry });
    sent++;
  }
  return sent;
}
