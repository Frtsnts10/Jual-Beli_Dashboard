import type { CustomerProfile, Order } from "@/types/schema";

/** One buyer of one store, built from that store's orders (+ their account, if any). */
export interface CustomerRow {
  /** Stable id for links: `u:<uid>` for account holders, `e:<email>` for guests. */
  key: string;
  uid: string | null;
  name: string;
  email: string;
  phone: string;
  /** Has a buyer account on the platform. */
  registered: boolean;
  orders: number;
  paid_orders: number;
  /** Sum of PAID orders. */
  total: number;
  first_order_at: string;
  last_order_at: string;
  open_claims: number;
  order_ids: string[];
}

const norm = (email: string) => email.trim().toLowerCase();

/**
 * Groups a store's orders into customers. Orders with an account (customer_uid) group by
 * account; guest orders group by email — and join the account row when that email already
 * belongs to an account that ordered here, so one person shows up once.
 */
export function aggregateCustomers(orders: Order[], profiles: Map<string, CustomerProfile>): CustomerRow[] {
  const uidByEmail = new Map<string, string>();
  for (const o of orders) {
    if (o.customer_uid) uidByEmail.set(norm(o.customer_contact.email), o.customer_uid);
  }
  for (const p of profiles.values()) uidByEmail.set(norm(p.email), p.uid);

  const rows = new Map<string, CustomerRow>();
  // Oldest first, so the newest order's contact details win.
  for (const o of [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const email = norm(o.customer_contact.email);
    const uid = o.customer_uid ?? uidByEmail.get(email) ?? null;
    const key = uid ? `u:${uid}` : `e:${email}`;
    const row =
      rows.get(key) ??
      ({
        key,
        uid,
        name: "",
        email,
        phone: "",
        registered: !!uid,
        orders: 0,
        paid_orders: 0,
        total: 0,
        first_order_at: o.created_at,
        last_order_at: o.created_at,
        open_claims: 0,
        order_ids: [],
      } satisfies CustomerRow);
    row.orders += 1;
    row.order_ids.push(o.id);
    row.last_order_at = o.created_at;
    if (o.customer_contact.phone) row.phone = o.customer_contact.phone;
    if (email) row.email = email;
    if (o.payment_status === "PAID") {
      row.paid_orders += 1;
      row.total += o.amount;
    }
    if (o.warranty_status === "CLAIMED") row.open_claims += 1;
    rows.set(key, row);
  }

  // The account's own profile (name, current email/phone) wins over order snapshots.
  for (const row of rows.values()) {
    const profile = row.uid ? profiles.get(row.uid) : undefined;
    if (!profile) continue;
    row.name = profile.name;
    if (profile.email) row.email = profile.email;
    if (profile.phone) row.phone = profile.phone;
  }
  return [...rows.values()].sort((a, b) => b.last_order_at.localeCompare(a.last_order_at));
}
