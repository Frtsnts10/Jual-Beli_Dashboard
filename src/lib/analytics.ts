import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { mapOrder } from "@/lib/firestore-mappers";
import type { Order } from "@/types/schema";

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(raw: string | undefined): RangeDays {
  const n = Number(raw);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

/** Orders created in the last `days` days (Jakarta calendar), newest first. */
export async function ordersSince(storeId: string, days: number): Promise<Order[]> {
  const since = new Date(Date.now() - days * 86_400_000);
  const snap = await adminDb
    .collection("orders")
    .where("store_id", "==", storeId)
    .where("created_at", ">=", Timestamp.fromDate(since))
    .orderBy("created_at", "desc")
    .limit(5000)
    .get();
  return snap.docs.map(mapOrder);
}

const jakartaDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

export function summarize(orders: Order[], days: number) {
  const paid = orders.filter((o) => o.payment_status === "PAID");
  const revenue = paid.reduce((s, o) => s + o.amount, 0);
  const fees = paid.reduce((s, o) => s + o.platform_fee, 0);

  // One bucket per day, including days without sales.
  const daily = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) daily.set(jakartaDay(new Date(Date.now() - i * 86_400_000).toISOString()), 0);
  for (const o of paid) {
    const day = jakartaDay(o.paid_at ?? o.created_at);
    if (daily.has(day)) daily.set(day, daily.get(day)! + o.amount);
  }

  const products = new Map<string, { title: string; qty: number; revenue: number }>();
  for (const o of paid) {
    const p = products.get(o.product_id) ?? { title: o.product_title, qty: 0, revenue: 0 };
    p.qty++;
    p.revenue += o.amount;
    products.set(o.product_id, p);
  }
  const referrals = new Map<string, { orders: number; revenue: number }>();
  for (const o of paid) {
    if (!o.referral_code) continue;
    const r = referrals.get(o.referral_code) ?? { orders: 0, revenue: 0 };
    r.orders++;
    r.revenue += o.amount;
    referrals.set(o.referral_code, r);
  }

  return {
    created: orders.length,
    paid: paid.length,
    failed: orders.filter((o) => o.payment_status === "FAILED").length,
    revenue,
    net: revenue - fees,
    aov: paid.length ? Math.round(revenue / paid.length) : 0,
    conversion: orders.length ? paid.length / orders.length : 0,
    claims: paid.filter((o) => o.warranty_status !== "VALID").length,
    daily: [...daily].map(([day, value]) => ({ day, value })),
    topProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    topReferrals: [...referrals].map(([code, v]) => ({ code, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
  };
}
