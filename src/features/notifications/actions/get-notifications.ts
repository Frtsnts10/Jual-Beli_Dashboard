"use server";

import { createAdminSupabase } from "@/lib/supabase/server";

export interface NotificationItem {
  id: string;
  type: "inventory" | "customer" | "order";
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

  // Gracefully fetch pending orders to avoid breaking the dashboard if table is missing
  let pendingOrders: any[] = [];
  try {
    const { data, error } = await adminSupabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .eq("fulfillment_status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      pendingOrders = data;
    }
  } catch (err) {
    console.warn("Orders table might not be initialized yet:", err);
  }

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

  // 3. Process Pending Orders for Fulfillment
  pendingOrders.forEach((order) => {
    const itemCount = Array.isArray(order.items) ? order.items.length : 1;
    const itemNames = Array.isArray(order.items)
      ? order.items.map((i: any) => i.name).join(", ")
      : "digital subscription";

    items.push({
      id: `order-${order.id}`,
      type: "order",
      title: "Order Fulfillment Pending",
      message: `Client "${order.customer_name}" purchased "${itemNames}" (${itemCount} item${itemCount > 1 ? 's' : ''}). Credentials require allocation.`,
      targetDate: new Date(order.created_at).toISOString().split("T")[0],
      isUrgent: true,
      actionPayload: {
        customerName: order.customer_name,
        productName: itemNames,
      },
    });
  });

  // Sort: most urgent / pending orders first
  return items.sort((a, b) => {
    // Put pending orders always at the top of the stack
    if (a.type === "order" && b.type !== "order") return -1;
    if (a.type !== "order" && b.type === "order") return 1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });
}
