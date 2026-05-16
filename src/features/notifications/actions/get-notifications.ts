"use server";

import { createAdminSupabase } from "@/lib/supabase/server";

export interface NotificationItem {
  id: string;
  type: "inventory" | "customer";
  title: string;
  message: string;
  targetDate: string;
  isUrgent: boolean;
  actionPayload?: {
    phone?: string | null;
    customerName?: string;
    productName?: string;
  };
}

export async function getNotificationsAction(storeId: string): Promise<NotificationItem[]> {
  const adminSupabase = await createAdminSupabase();

  const [invRes, custRes] = await Promise.all([
    adminSupabase.from("inventory").select("*").eq("store_id", storeId),
    adminSupabase.from("customers").select("*").eq("store_id", storeId),
  ]);

  const items: NotificationItem[] = [];
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  // 1. Process Inventory Account Renewals Countdown
  if (invRes.data) {
    invRes.data.forEach((item) => {
      if (item.date_expired) {
        const exp = new Date(item.date_expired).getTime();
        const diff = exp - now;
        if (diff <= threeDaysMs) {
          const isExpired = diff < 0;
          const daysLeft = Math.ceil(Math.abs(diff) / (24 * 60 * 60 * 1000));
          items.push({
            id: `inv-${item.id}`,
            type: "inventory",
            title: isExpired ? "Inventory Shard Expired!" : "Stock Expiry Warning",
            message: `Master credential pool "${item.name}" ${item.profile_name ? `(${item.profile_name})` : ""} ${
              isExpired ? `expired ${daysLeft} days ago.` : `expires in ${daysLeft} days.`
            } Ensure subscription renewal to maintain pooled capacity.`,
            targetDate: item.date_expired,
            isUrgent: isExpired || diff <= 24 * 60 * 60 * 1000,
          });
        }
      }
    });
  }

  // 2. Process Customer Stream Renewals Countdown (n8n ready)
  if (custRes.data) {
    custRes.data.forEach((cust) => {
      const prods = Array.isArray(cust.purchased_products) ? cust.purchased_products : [];
      prods.forEach((p: any, index: number) => {
        if (p.bought_date && p.duration_days) {
          const start = new Date(p.bought_date).getTime();
          const durationMs = Number(p.duration_days) * 24 * 60 * 60 * 1000;
          const exp = start + durationMs;
          const diff = exp - now;

          if (diff <= threeDaysMs) {
            const isExpired = diff < 0;
            const daysLeft = Math.ceil(Math.abs(diff) / (24 * 60 * 60 * 1000));
            items.push({
              id: `cust-${cust.id}-${index}`,
              type: "customer",
              title: isExpired ? "Customer Shard Lapsed" : "SLA Stream Extension Countdown",
              message: `Client "${cust.name}" subscription stream for "${p.product_name}" ${
                isExpired ? `lapsed ${daysLeft} days ago.` : `expires in ${daysLeft} days.`
              } Target for automated n8n WhatsApp trigger loop.`,
              targetDate: new Date(exp).toISOString().split("T")[0],
              isUrgent: isExpired || diff <= 24 * 60 * 60 * 1000,
              actionPayload: {
                phone: cust.phone,
                customerName: cust.name,
                productName: p.product_name,
              },
            });
          }
        }
      });
    });
  }

  // Sort: most urgent first
  return items.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
}
