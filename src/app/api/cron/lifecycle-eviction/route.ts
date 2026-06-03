import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";

export async function GET() {
  const now = new Date();
  const threeHoursFromNow = new Date(now.getTime() + 3 * 3600 * 1000);

  // 1. TRIGGER NOTIFICATIONS (H-3 Warning) — items expiring within 3 hours
  const invSnap = await adminDb.collection("inventory")
    .where("date_expired", "<=", threeHoursFromNow.toISOString())
    .where("date_expired", ">", now.toISOString())
    .get();

  const expiringSoon = invSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((item: any) => item.profile_name);

  if (expiringSoon.length > 0) {
    expiringSoon.forEach((item: any) => {
      console.log(`[LIFECYCLE HOOK] Auto-sending alert to slot consumer: ${item.profile_name} for asset ${item.name}. Renew window closing in 3 hours.`);
    });
  }

  // 2. EXECUTE AUTO-KICK — expired items
  const expiredSnap = await adminDb.collection("inventory")
    .where("date_expired", "<=", now.toISOString())
    .get();

  const expiredItems = expiredSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((item: any) => item.profile_name);

  if (expiredItems.length > 0) {
    const batch = adminDb.batch();
    for (const item of expiredItems) {
      batch.update(adminDb.collection("inventory").doc(item.id), {
        profile_name: null,
        date_buy: null,
        date_expired: null,
      });
      console.log(`[EVICTION VECTOR] Purged expired subscription occupant '${(item as any).profile_name}' from inventory slot ID: ${item.id}`);
    }
    await batch.commit();
  }

  return NextResponse.json({ processedHooks: true, evictedCount: expiredItems.length, notifiedCount: expiringSoon.length });
}
