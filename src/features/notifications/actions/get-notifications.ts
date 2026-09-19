"use server";

import { adminDb } from "@/lib/firebase/server";
import { dictionaries, Language } from "@/locales/dictionary";

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

export async function getNotificationsAction(storeId: string, lang: Language = "id"): Promise<NotificationItem[]> {
  const t = dictionaries[lang]?.notifications || dictionaries.id.notifications;
  const [invSnap, custSnap] = await Promise.all([
    adminDb.collection("inventory").where("store_id", "==", storeId).get(),
    adminDb.collection("customers").where("store_id", "==", storeId).get(),
  ]);

  let pendingOrders: any[] = [];
  try {
    const ordersSnap = await adminDb.collection("orders")
      .where("store_id", "==", storeId)
      .where("fulfillment_status", "==", "pending")
      .get();
    pendingOrders = ordersSnap.docs
      .map(d => ({ id: d.id, ...d.data() as any }))
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  } catch (err) {
    console.warn("Orders collection might not be initialized yet:", err);
  }

  const items: NotificationItem[] = [];
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  // 1. Process Inventory Account Renewals
  invSnap.docs.forEach((doc) => {
    const item = doc.data();
    if (item.date_expired) {
      const exp = new Date(item.date_expired).getTime();
      const diff = exp - now;
      if (diff <= threeDaysMs) {
        const isExpired = diff < 0;
        const daysLeft = Math.ceil(Math.abs(diff) / (24 * 60 * 60 * 1000));
        items.push({
          id: `inv-${doc.id}`,
          type: "inventory",
          title: isExpired ? t.invExpired : t.stockWarning,
          message: isExpired ? t.invMsgExpired.replace("{name}", item.name).replace("{profile}", item.profile_name ? `(${item.profile_name})` : "").replace("{days}", String(daysLeft)) : t.invMsgExpiring.replace("{name}", item.name).replace("{profile}", item.profile_name ? `(${item.profile_name})` : "").replace("{days}", String(daysLeft)),
          targetDate: item.date_expired,
          isUrgent: isExpired || diff <= 24 * 60 * 60 * 1000,
        });
      }
    }
  });

  // 2. Process Customer Stream Renewals
  custSnap.docs.forEach((doc) => {
    const cust = doc.data();
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
            id: `cust-${doc.id}-${index}`,
            type: "customer",
            title: isExpired ? t.custLapsed : t.slaCountdown,
            message: isExpired ? t.custMsgExpired.replace("{name}", cust.name).replace("{product}", p.product_name).replace("{days}", String(daysLeft)) : t.custMsgExpiring.replace("{name}", cust.name).replace("{product}", p.product_name).replace("{days}", String(daysLeft)),
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

  // 3. Process Pending Orders
  pendingOrders.forEach((order) => {
    const itemCount = Array.isArray(order.items) ? order.items.length : 1;
    const itemNames = Array.isArray(order.items)
      ? order.items.map((i: any) => i.name).join(", ")
      : "digital subscription";

    items.push({
      id: `order-${order.id}`,
      type: "order",
      title: t.orderPending,
      message: t.orderMsg.replace("{name}", order.customer_name).replace("{product}", itemNames).replace("{count}", String(itemCount)),
      targetDate: new Date(order.created_at).toISOString().split("T")[0],
      isUrgent: true,
      actionPayload: {
        customerName: order.customer_name,
        productName: itemNames,
      },
    });
  });

  return items.sort((a, b) => {
    if (a.type === "order" && b.type !== "order") return -1;
    if (a.type !== "order" && b.type === "order") return 1;
    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
  });
}
