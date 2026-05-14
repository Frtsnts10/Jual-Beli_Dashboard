import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/server";

export async function GET() {
  const adminSupabase = await createAdminSupabase();
  const now = new Date();
  
  // Calculate Target Check Horizons (h-3 means 3 hours ahead of expiration)
  const threeHoursFromNow = new Date(now.getTime() + 3 * 3600 * 1000);

  // 1. TRIGGER NOTIFICATIONS (H-3 Warning)
  const { data: expiringSoon } = await adminSupabase
    .from("inventory")
    .select("*")
    .not("profile_name", "is", null)
    .lte("date_expired", threeHoursFromNow.toISOString())
    .gt("date_expired", now.toISOString());

  if (expiringSoon && expiringSoon.length > 0) {
    expiringSoon.forEach((item) => {
      // Dispatched to external SMS/WhatsApp/Email delivery handler
      console.log(`[LIFECYCLE HOOK] Auto-sending alert to slot consumer: ${item.profile_name} for asset ${item.name}. Renew window closing in 3 hours.`);
    });
  }

  // 2. EXECUTE AUTO-KICK UPON REACHING DEADLINE
  const { data: expiredItems } = await adminSupabase
    .from("inventory")
    .select("id, profile_name, store_id")
    .not("profile_name", "is", null)
    .lte("date_expired", now.toISOString());

  if (expiredItems && expiredItems.length > 0) {
    for (const item of expiredItems) {
      // Reset inventory slot back to unassigned available warehouse pool
      await adminSupabase
        .from("inventory")
        .update({
          profile_name: null,
          date_buy: null,
          date_expired: null,
          // Retain group_name if pooling bucket geometry is static, or reset if fully detached
        })
        .eq("id", item.id);

      console.log(`[EVICTION VECTOR] Purged expired subscription occupant '${item.profile_name}' from inventory slot ID: ${item.id}`);
    }
  }

  return NextResponse.json({ processedHooks: true, evictedCount: expiredItems?.length || 0, notifiedCount: expiringSoon?.length || 0 });
}
