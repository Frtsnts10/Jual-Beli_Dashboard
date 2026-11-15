import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { effectiveTier, mapStore, toISO } from "@/lib/data/mappers";
import type { SubscriptionTier } from "@/types/schema";

export function monthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function platformOverview() {
  const since = Timestamp.fromDate(monthStart());
  const [users, stores, orders, subs] = await Promise.all([
    adminDb.collection("users").select("subscription_tier", "subscription_expiry").get(),
    adminDb.collection("stores").count().get(),
    adminDb.collection("orders").where("paid_at", ">=", since).select("amount", "payment_status").get(),
    adminDb.collection("subscription_payments").where("paid_at", ">=", since).select("amount", "status").get(),
  ]);
  const tiers: Record<SubscriptionTier, number> = { starter: 0, pro: 0, ultimate: 0 };
  for (const u of users.docs) tiers[effectiveTier(u.get("subscription_tier"), u.get("subscription_expiry"))]++;
  const paid = orders.docs.filter((o) => o.get("payment_status") === "PAID");
  return {
    users: users.size,
    stores: stores.data().count,
    tiers,
    gmv: paid.reduce((s, o) => s + (o.get("amount") ?? 0), 0),
    ordersPaid: paid.length,
    subscriptionRevenue: subs.docs.filter((s) => s.get("status") === "PAID").reduce((s, p) => s + (p.get("amount") ?? 0), 0),
  };
}

export async function allStores() {
  const [stores, users] = await Promise.all([adminDb.collection("stores").get(), adminDb.collection("users").select("email", "subscription_tier", "subscription_expiry").get()]);
  const owners = new Map(users.docs.map((u) => [u.id, { email: u.get("email") as string, tier: effectiveTier(u.get("subscription_tier"), u.get("subscription_expiry")) }]));
  return stores.docs
    .map((s) => ({ ...mapStore(s), suspended_reason: (s.get("suspended_reason") as string | null) ?? null, owner: owners.get(s.get("owner_uid")) ?? null }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function allUsers() {
  const [users, stores] = await Promise.all([adminDb.collection("users").get(), adminDb.collection("stores").select("owner_uid").get()]);
  const storeCount = new Map<string, number>();
  for (const s of stores.docs) storeCount.set(s.get("owner_uid"), (storeCount.get(s.get("owner_uid")) ?? 0) + 1);
  return users.docs
    .map((u) => ({
      uid: u.id,
      email: (u.get("email") as string) ?? "",
      name: (u.get("full_name") as string) ?? "",
      tier: effectiveTier(u.get("subscription_tier"), u.get("subscription_expiry")),
      expiry: toISO(u.get("subscription_expiry")),
      created_at: toISO(u.get("created_at")) ?? "",
      stores: storeCount.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
