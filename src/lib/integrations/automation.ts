import "server-only";
import { createHmac } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { deliveryMessage, fillTemplate, waNumber } from "@/lib/integrations/whatsapp";
import { formatDate, formatIDR } from "@/lib/utils";
import { DEFAULT_WA_TEMPLATE } from "@/config/tiers";
import { featuresOfUser } from "@/lib/catalog";
import { storefrontUrl } from "@/lib/store-url";
import { credentialValues } from "@/lib/data/mappers";
import { entryConfig, normalizeStockConfig, templateFor } from "@/lib/stock-config";

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
  phone_number_id: string | null;
  server: string | null;
  template: string;
}

/** What n8n needs to send through the store's own provider (see docs/n8n.md). */
export function waPayload(integrations: FirebaseFirestore.DocumentSnapshot) {
  return {
    provider: (integrations.get("wa_api_provider") as string | undefined) ?? null,
    token: (integrations.get("wa_api_token") as string | undefined) ?? null,
    phone_number_id: (integrations.get("wa_phone_number_id") as string | undefined) ?? null,
    server: (integrations.get("wa_server") as string | undefined) ?? null,
  };
}

async function storeContext(storeId: string) {
  const [store, integrations] = await Promise.all([
    adminDb.collection("stores").doc(storeId).get(),
    adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get(),
  ]);
  const owner = await adminDb.collection("users").doc(store.get("owner_uid")).get();
  const features = await featuresOfUser(owner);
  const wa: WaConfig = {
    ...waPayload(integrations),
    template: integrations.get("wa_message_template") ?? DEFAULT_WA_TEMPLATE,
  };
  return { storeName: store.get("store_name") as string, features, wa };
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
  if (!ctx.features.autoFulfillment || !ctx.wa.provider || !ctx.wa.token) return "skipped";

  const credentials = await adminDb.getAll(...credentialIds.map((id) => adminDb.collection("credentials_vault").doc(id)));
  const components = await adminDb.getAll(...credentials.map((c) => adminDb.collection("products").doc(c.get("product_id"))));
  const slots = (order.get("credential_slots") as Record<string, number> | undefined) ?? {};
  const message = deliveryMessage(
    { store: ctx.storeName, order_id: orderId, expiry: formatDate(order.get("access_expires_at")?.toDate?.().toISOString()) },
    credentials.map((c, i) => {
      const values = credentialValues(c.data() ?? {});
      const config = entryConfig(normalizeStockConfig(components[i].get("stock_config")), values);
      return {
        product: credentials.length > 1 ? components[i].get("title") : order.get("product_title"),
        template: templateFor(config, ctx.wa.template),
        values,
        slot: slots[c.id] ? `${slots[c.id]}/${c.get("slots_total") ?? 1}` : "",
      };
    })
  );

  try {
    await postToN8n({
      event: "order.delivery",
      reason,
      order_id: orderId,
      store_id: order.get("store_id"),
      to: waNumber(order.get("customer_contact.phone")),
      message,
      wa: { provider: ctx.wa.provider, token: ctx.wa.token, phone_number_id: ctx.wa.phone_number_id, server: ctx.wa.server },
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
  if (!ctx.features.autoFulfillment || !ctx.wa.provider || !ctx.wa.token) return false;

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
    wa: { provider: ctx.wa.provider, token: ctx.wa.token, phone_number_id: ctx.wa.phone_number_id, server: ctx.wa.server },
  });
  // Flag only after n8n accepted it, so a failed run is retried by the next cron.
  await orderRef.update({ renewal_notified: true });
  return true;
}

const RESTOCK_TEMPLATE = "Halo! {product} di {store} sudah tersedia lagi. Stok terbatas, amankan sekarang: {link}";

/**
 * "Kabari saya" (Pro & Ultimate, WhatsApp configured): when stock comes back for these
 * products, every buyer still waiting on them — or on a bundle they complete — gets one
 * WhatsApp message through n8n. Requests are marked notified only after n8n accepts the
 * batch, so a failed send is retried on the next restock. Never throws.
 */
export async function notifyRestock(storeId: string, restockedIds: string[]): Promise<number> {
  try {
    const ctx = await storeContext(storeId);
    if (!ctx.features.autoFulfillment || !ctx.wa.provider || !ctx.wa.token) return 0;

    // Products to announce: the restocked ones, plus bundles that are now complete again.
    const products = await adminDb.collection("products").where("store_id", "==", storeId).get();
    const byId = new Map(products.docs.map((d) => [d.id, d]));
    const stockOf = (id: string): number => {
      const p = byId.get(id);
      if (!p) return 0;
      const items = p.get("bundle_items") as string[] | null;
      return items?.length ? Math.min(...items.map((c) => byId.get(c)?.get("stock_available") ?? 0)) : (p.get("stock_available") ?? 0);
    };
    const candidates = products.docs
      .filter((p) => restockedIds.includes(p.id) || (p.get("bundle_items") as string[] | null)?.some((c) => restockedIds.includes(c)))
      .filter((p) => p.get("is_published") && stockOf(p.id) > 0);

    const store = await adminDb.collection("stores").doc(storeId).get();
    const base = storefrontUrl({ slug: store.get("slug"), custom_domain: store.get("custom_domain") ?? null, custom_domain_status: store.get("custom_domain_status") ?? null });
    let sent = 0;
    for (const p of candidates) {
      const waiting = await adminDb
        .collection("restock_requests")
        .where("store_id", "==", storeId)
        .where("product_id", "==", p.id)
        .where("notified_at", "==", null)
        .limit(500)
        .get();
      const recipients = [...new Set(waiting.docs.map((d) => waNumber(d.get("phone") ?? "")).filter(Boolean))];
      if (!recipients.length) continue;
      await postToN8n({
        event: "product.restock",
        store_id: storeId,
        product_id: p.id,
        recipients,
        message: fillTemplate(RESTOCK_TEMPLATE, { product: p.get("title"), store: ctx.storeName, link: `${base}/p/${p.id}` }),
        wa: { provider: ctx.wa.provider, token: ctx.wa.token, phone_number_id: ctx.wa.phone_number_id, server: ctx.wa.server },
      });
      const batch = adminDb.batch();
      waiting.docs.forEach((d) => batch.update(d.ref, { notified_at: FieldValue.serverTimestamp() }));
      await batch.commit();
      sent += recipients.length;
    }
    return sent;
  } catch (err) {
    console.error(`Restock notification failed for ${storeId}:`, err);
    return 0;
  }
}

/**
 * Payment outcome to the buyer's WhatsApp (Pro & Ultimate with a provider, unless the seller
 * turned it off): confirmed with the receipt link, or rejected with the seller's reason.
 * Sent once per checkout (a cart is one message). Never throws.
 */
export async function noticeBuyer(groupId: string, kind: "paid" | "rejected", reason?: string): Promise<"sent" | "skipped" | "failed"> {
  try {
    const lead = await adminDb.collection("orders").doc(groupId).get();
    if (!lead.exists) return "skipped";
    const storeId = lead.get("store_id") as string;
    const [ctx, integrations, store] = await Promise.all([
      storeContext(storeId),
      adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get(),
      adminDb.collection("stores").doc(storeId).get(),
    ]);
    if (!ctx.features.autoFulfillment || !ctx.wa.provider || !ctx.wa.token || integrations.get("wa_notify_buyer") === false) return "skipped";
    const total = (lead.get("group_total") as number | undefined) ?? (lead.get("amount") as number);
    const base = storefrontUrl({ slug: store.get("slug"), custom_domain: store.get("custom_domain") ?? null, custom_domain_status: store.get("custom_domain_status") ?? null });
    const message =
      kind === "paid"
        ? `Halo! Pembayaran ${formatIDR(total)} untuk pesanan ${groupId} di ${ctx.storeName} sudah dikonfirmasi. Terima kasih!\n\nAkun dikirim lewat pesan terpisah. Struk: ${base}/struk/${groupId}`
        : `Halo, pembayaran pesanan ${groupId} di ${ctx.storeName} ditolak penjual: ${reason ?? "-"}.\n\nJika Anda sudah membayar ${formatIDR(total)}, balas pesan ini dengan bukti transfernya.`;
    await postToN8n({
      event: "order.notice",
      kind: kind === "paid" ? "buyer_paid" : "buyer_rejected",
      order_id: groupId,
      store_id: storeId,
      to: waNumber(lead.get("customer_contact.phone")),
      message,
      wa: { provider: ctx.wa.provider, token: ctx.wa.token, phone_number_id: ctx.wa.phone_number_id, server: ctx.wa.server },
    });
    return "sent";
  } catch (err) {
    console.error(`Buyer notice failed for ${groupId}:`, err);
    return "failed";
  }
}
