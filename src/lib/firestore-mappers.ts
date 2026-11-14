import "server-only";
import { decryptSecret } from "@/lib/vault-crypto";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import type { Credential, Order, Product, Store, SubscriptionPayment, SubscriptionTier, UserDoc } from "@/types/schema";

export function toISO(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

type Snap = DocumentSnapshot;

/**
 * A paid plan whose subscription_expiry has passed falls back to Starter. Computed on
 * read, so expiry needs no cron job. Keep in sync with the storefront's lib/stores.ts.
 */
export function effectiveTier(tier: SubscriptionTier | undefined, expiry: unknown): SubscriptionTier {
  if (!tier || tier === "starter") return "starter";
  const iso = toISO(expiry);
  if (iso && new Date(iso) < new Date()) return "starter";
  return tier;
}

export function mapUser(snap: Snap): UserDoc {
  const d = snap.data() ?? {};
  return {
    uid: snap.id,
    email: d.email ?? "",
    full_name: d.full_name ?? "",
    subscription_tier: effectiveTier(d.subscription_tier, d.subscription_expiry),
    subscription_expiry: toISO(d.subscription_expiry),
    created_at: toISO(d.created_at) ?? "",
  };
}

export function mapStore(snap: Snap): Store {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    owner_uid: d.owner_uid,
    store_name: d.store_name ?? "",
    slug: d.slug ?? "",
    custom_domain: d.custom_domain ?? null,
    custom_domain_status: d.custom_domain_status
      ? { ...d.custom_domain_status, checked_at: toISO(d.custom_domain_status.checked_at) }
      : null,
    storefront_config: {
      layout_template: d.storefront_config?.layout_template ?? "template_c_hero",
      accent_color: d.storefront_config?.accent_color ?? "#10B981",
      tagline: d.storefront_config?.tagline ?? "",
      banner_url: d.storefront_config?.banner_url ?? "",
      logo_url: d.storefront_config?.logo_url ?? "",
    },
    is_active: d.is_active ?? true,
    created_at: toISO(d.created_at) ?? "",
  };
}

export function mapProduct(snap: Snap): Product {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    store_id: d.store_id,
    title: d.title ?? "",
    description: d.description ?? "",
    image_url: d.image_url ?? null,
    platform_type: d.platform_type ?? "Other",
    price: d.price ?? 0,
    duration_days: d.duration_days ?? 30,
    bundle_items: d.bundle_items ?? null,
    is_flash_sale: d.is_flash_sale ?? false,
    flash_sale_price: d.flash_sale_price ?? null,
    flash_sale_ends_at: toISO(d.flash_sale_ends_at),
    is_published: d.is_published ?? false,
    stock_available: d.stock_available ?? 0,
    created_at: toISO(d.created_at) ?? "",
    updated_at: toISO(d.updated_at) ?? "",
  };
}

export function mapCredential(snap: Snap): Credential {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    store_id: d.store_id,
    product_id: d.product_id,
    account_email: d.account_email ?? "",
    account_password: decryptSecret(d.account_password),
    profile_pin: decryptSecret(d.profile_pin),
    status: d.status ?? "AVAILABLE",
    expiry_date: toISO(d.expiry_date),
    order_id: d.order_id ?? null,
    created_at: toISO(d.created_at) ?? "",
    sold_at: toISO(d.sold_at),
  };
}

export function mapOrder(snap: Snap): Order {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    store_id: d.store_id,
    product_id: d.product_id,
    product_title: d.product_title ?? "",
    amount: d.amount ?? 0,
    credential_id: d.credential_id ?? null,
    credential_ids: d.credential_ids ?? (d.credential_id ? [d.credential_id] : []),
    customer_contact: { email: d.customer_contact?.email ?? "", phone: d.customer_contact?.phone ?? "" },
    payment_status: d.payment_status ?? "PENDING",
    xendit_invoice_id: d.xendit_invoice_id ?? null,
    xendit_invoice_url: d.xendit_invoice_url ?? null,
    delivery_status: d.delivery_status ?? "PENDING",
    delivery_error: d.delivery_error ?? null,
    warranty_status: d.warranty_status ?? "VALID",
    warranty_claim: d.warranty_claim
      ? { reason: d.warranty_claim.reason ?? "", claimed_at: toISO(d.warranty_claim.claimed_at) ?? "" }
      : null,
    needs_stock: d.needs_stock ?? false,
    renewal_notified: d.renewal_notified ?? false,
    referral_code: d.referral_code ?? null,
    settlement: d.settlement ?? "PLATFORM",
    platform_fee: d.platform_fee ?? 0,
    created_at: toISO(d.created_at) ?? "",
    paid_at: toISO(d.paid_at),
    access_expires_at: toISO(d.access_expires_at),
  };
}

export function mapSubscriptionPayment(snap: Snap): SubscriptionPayment {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    uid: d.uid,
    tier: d.tier,
    period: d.period,
    amount: d.amount ?? 0,
    status: d.status ?? "PENDING",
    xendit_invoice_id: d.xendit_invoice_id ?? null,
    xendit_invoice_url: d.xendit_invoice_url ?? null,
    created_at: toISO(d.created_at) ?? "",
    paid_at: toISO(d.paid_at),
  };
}
