import "server-only";
import { isAdminEmail } from "@/lib/access/platform";
import { cleanOverrides } from "@/lib/catalog-core";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { effectiveTier, mapStore, mapSubscriptionPayment, toISO } from "@/lib/data/mappers";
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
      admin: isAdminEmail((u.get("email") as string) ?? ""),
      overrides: cleanOverrides(u.get("feature_overrides")),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Plan purchases still open (proof uploaded, or inside their pay window), proofs first, plus recent closed ones. */
export async function subscriptionPaymentsForReview() {
  const [pendingSnap, recentSnap] = await Promise.all([
    adminDb.collection("subscription_payments").where("status", "==", "PENDING").get(),
    adminDb.collection("subscription_payments").orderBy("created_at", "desc").limit(30).get(),
  ]);
  const withEmail = (d: FirebaseFirestore.QueryDocumentSnapshot) => ({ ...mapSubscriptionPayment(d), email: (d.get("email") as string) ?? d.get("uid") });
  const now = Date.now();
  const pending = pendingSnap.docs
    .map(withEmail)
    .filter((p) => p.proof_uploaded_at || (p.pay_by && new Date(p.pay_by).getTime() > now))
    .sort((a, b) => Number(!!b.proof_uploaded_at) - Number(!!a.proof_uploaded_at) || b.created_at.localeCompare(a.created_at));
  const recent = recentSnap.docs.map(withEmail).filter((p) => p.status !== "PENDING");
  return { pending, recent };
}

/** Buyers' pending account-deletion requests, oldest first, with what deleting would touch. */
export async function accountDeletionRequests() {
  const snap = await adminDb.collection("account_deletion_requests").where("status", "==", "PENDING").get();
  const rows = await Promise.all(
    snap.docs.map(async (d) => {
      const [orders, seller, store] = await Promise.all([
        adminDb.collection("orders").where("customer_uid", "==", d.id).count().get(),
        adminDb.collection("users").doc(d.id).get(),
        d.get("store_id") ? adminDb.collection("stores").doc(d.get("store_id")).get() : null,
      ]);
      return {
        uid: d.id,
        email: (d.get("email") as string) ?? "",
        name: (d.get("name") as string) ?? "",
        reason: (d.get("reason") as string) ?? "",
        store: (store?.get("store_name") as string | undefined) ?? null,
        requested_at: toISO(d.get("requested_at")) ?? "",
        orders: orders.data().count,
        isSeller: seller.exists,
        kind: (d.get("kind") as string) === "seller" ? ("seller" as const) : ("buyer" as const),
        stores: d.get("kind") === "seller" ? (await adminDb.collection("stores").where("owner_uid", "==", d.id).count().get()).data().count : 0,
      };
    })
  );
  return rows.sort((a, b) => a.requested_at.localeCompare(b.requested_at));
}

const jakartaDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

/**
 * Last 30 days across the platform, for Ringkasan: daily GMV (paid store orders) and plan
 * revenue, the top stores by GMV, and the latest plan payments.
 */
export async function platformActivity(days = 30) {
  const from = new Date(Date.now() - (days - 1) * 86_400_000);
  from.setHours(0, 0, 0, 0);
  const since = Timestamp.fromDate(from);
  const [orders, subs, stores, recentSubs] = await Promise.all([
    adminDb.collection("orders").where("paid_at", ">=", since).select("amount", "payment_status", "paid_at", "store_id").get(),
    adminDb.collection("subscription_payments").where("paid_at", ">=", since).select("amount", "status", "paid_at").get(),
    adminDb.collection("stores").select("store_name", "slug").get(),
    adminDb.collection("subscription_payments").orderBy("created_at", "desc").limit(8).get(),
  ]);
  const series = new Map<string, { gmv: number; plans: number }>();
  for (let i = 0; i < days; i++) series.set(jakartaDay(new Date(from.getTime() + i * 86_400_000)), { gmv: 0, plans: 0 });
  const byStore = new Map<string, { gmv: number; orders: number }>();
  for (const o of orders.docs) {
    if (o.get("payment_status") !== "PAID") continue;
    const amount = (o.get("amount") as number) ?? 0;
    const day = series.get(jakartaDay(o.get("paid_at").toDate()));
    if (day) day.gmv += amount;
    const s = byStore.get(o.get("store_id")) ?? { gmv: 0, orders: 0 };
    s.gmv += amount;
    s.orders++;
    byStore.set(o.get("store_id"), s);
  }
  for (const p of subs.docs) {
    if (p.get("status") !== "PAID") continue;
    const day = series.get(jakartaDay(p.get("paid_at").toDate()));
    if (day) day.plans += (p.get("amount") as number) ?? 0;
  }
  const names = new Map(stores.docs.map((s) => [s.id, (s.get("store_name") as string) ?? s.id]));
  return {
    daily: [...series].map(([day, v]) => ({ day, ...v })),
    topStores: [...byStore]
      .map(([id, v]) => ({ id, name: names.get(id) ?? id, ...v }))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, 5),
    recentPayments: recentSubs.docs.map((d) => ({ ...mapSubscriptionPayment(d), email: (d.get("email") as string) ?? "" })),
  };
}
