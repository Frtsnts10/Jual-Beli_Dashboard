import "server-only";
import { createHmac } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { deliveryMessage, fillTemplate, waNumber } from "@/lib/integrations/whatsapp";
import { formatDate } from "@/lib/utils";
import { DEFAULT_WA_TEMPLATE, TIERS } from "@/config/tiers";
import { effectiveTier } from "@/lib/data/mappers";
import { decryptSecret } from "@/lib/vault-crypto";

// Automation bridge to n8n (plan-dashboard.md §2/§4). The dashboard decides *what* to send;
// an n8n workflow listening on N8N_WEBHOOK_URL does the *sending* through the store's
// WhatsApp provider (Fonnte / Wablas / Meta), using the provider + token in the payload.
// Every request carries X-Signature: sha256=HMAC(N8N_WEBHOOK_SECRET, raw body) so the
// workflow can reject forged calls. Payload reference: docs/n8n.md.

export type AutomationEvent =
  | { type: "order.delivery"; reason: "paid" | "warranty_replacement" | "restock" }
  | { type: "order.renewal_reminder" }
  | { type: "broadcast" };

interface WaConfig {
  provider: string | null;
  token: string | null;
  template: string;
}

async function storeContext(storeId: string) {
  const [store, integrations] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get(),
  ]);
  const owner = await adminDb.collection("users").doc(store.get("owner_uid")).get();
  const tier = effectiveTier(owner.get("subscription_tier"), owner.get("subscription_expiry"));
  const wa: WaConfig = {
    provider: integrations.get("wa_api_provider") ?? null,
    token: integrations.get("wa_api_token") ?? null,
    template: integrations.get("wa_message_template") ?? DEFAULT_WA_TEMPLATE,
  };
  return { storeName: store.get("store_name") as string, tier, wa };
}

export async function postToN8n(payload: Record<string, unknown>) {
  const url = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!url || !secret) throw new Error("N8N_WEBHOOK_URL / N8N_WEBHOOK_SECRET are not set");
  const body = JSON.stringify(payload);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`,
    },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`n8n responded ${res.status}`);
}

/**
 * Auto-fulfilment (Pro & Ultimate): sends the allocated credential to the buyer's
 * WhatsApp through n8n and marks the order SENT_VIA_WA. Starter stores, or stores without
 * a WA provider configured, are skipped and keep the manual "Kirim via WhatsApp" button.
 * Never throws: a delivery failure is recorded on the order for the seller to see.
 */
export async function deliverOrder(orderId: string, reason: "paid" | "warranty_replacement" | "restock"): Promise<"sent" | "skipped" | "failed"> {
  const orderRef = adminDb.collection("orders").doc(orderId);
  const order = await orderRef.get();
  const credentialIds = ((order.get("credential_ids") as string[] | undefined) ?? [order.get("credential_id")]).filter(Boolean) as string[];
  if (!order.exists || order.get("payment_status") !== "PAID" || credentialIds.length === 0) return "skipped";

  const ctx = await storeContext(order.get("store_id"));
  if (!TIERS[ctx.tier].autoFulfillment || !ctx.wa.provider || !ctx.wa.token) return "skipped";

  const credentials = await adminDb.getAll(...credentialIds.map((id) => adminDb.collection("credentials_vault").doc(id)));
  const components = await adminDb.getAll(...credentials.map((c) => adminDb.collection("products").doc(c.get("product_id"))));
  const message = deliveryMessage(
    ctx.wa.template,
    { store: ctx.storeName, order_id: orderId, expiry: formatDate(order.get("access_expires_at")?.toDate?.().toISOString()) },
    credentials.map((c, i) => ({
      product: credentials.length > 1 ? components[i].get("title") : order.get("product_title"),
      email: c.get("account_email"),
      password: decryptSecret(c.get("account_password")),
      pin: decryptSecret(c.get("profile_pin")),
    }))
  );

  try {
    await postToN8n({
      event: "order.delivery",
      reason,
      order_id: orderId,
      store_id: order.get("store_id"),
      to: waNumber(order.get("customer_contact.phone")),
      message,
      wa: { provider: ctx.wa.provider, token: ctx.wa.token },
    });
    await orderRef.update({ delivery_status: "SENT_VIA_WA", delivery_error: null, delivered_at: FieldValue.serverTimestamp() });
    return "sent";
  } catch (err) {
    console.error(`Auto-delivery failed for ${orderId}:`, err);
    await orderRef.update({ delivery_error: err instanceof Error ? err.message : "Pengiriman otomatis gagal" });
    return "failed";
  }
}

const RENEWAL_TEMPLATE =
  "Halo! Akun {product} dari {store} (order {order_id}) akan berakhir pada {expiry}. Perpanjang sekarang supaya tidak terputus: {link}";

/** H-3 renewal reminder for one order (Pro & Ultimate). Returns whether it was sent. */
export async function remindRenewal(orderId: string, storefrontLink: string) {
  const orderRef = adminDb.collection("orders").doc(orderId);
  const order = await orderRef.get();
  const ctx = await storeContext(order.get("store_id"));
  if (!TIERS[ctx.tier].autoFulfillment || !ctx.wa.provider || !ctx.wa.token) return false;

  await postToN8n({
    event: "order.renewal_reminder",
    order_id: orderId,
    store_id: order.get("store_id"),
    to: waNumber(order.get("customer_contact.phone")),
    message: fillTemplate(RENEWAL_TEMPLATE, {
      product: order.get("product_title"),
      store: ctx.storeName,
      order_id: orderId,
      expiry: formatDate(order.get("access_expires_at")?.toDate?.().toISOString()),
      link: storefrontLink,
    }),
    wa: { provider: ctx.wa.provider, token: ctx.wa.token },
  });
  // Flag only after n8n accepted it, so a failed run is retried by the next cron.
  await orderRef.update({ renewal_notified: true });
  return true;
}
