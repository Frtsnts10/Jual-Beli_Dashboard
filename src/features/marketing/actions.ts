"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { postToN8n, waPayload } from "@/lib/integrations/automation";
import { fillTemplate, waNumber } from "@/lib/integrations/whatsapp";

const COOLDOWN_MS = 60 * 60 * 1000;
const MAX_RECIPIENTS = 1000;

/**
 * WhatsApp Broadcast CRM (Ultimate): sends one promo message to every past buyer (or the
 * buyers of one product). Recipients come from the store's own PAID orders, de-duplicated.
 * One broadcast per hour per store to protect the seller's WhatsApp number from bans.
 */
export async function sendBroadcast(storeId: string, input: { message: string; productId: string | null }): Promise<ActionResult<{ recipients: number }>> {
  const { store, features } = await requireStore(storeId);
  if (!features.marketing) return fail("Broadcast belum tersedia di paket Anda.");
  const message = input.message.trim();
  if (message.length < 10) return fail("Pesan terlalu pendek.");
  if (message.length > 1000) return fail("Pesan maksimal 1000 karakter.");

  const last = await adminDb.collection("broadcasts").where("store_id", "==", storeId).orderBy("created_at", "desc").limit(1).get();
  const lastAt = (last.docs[0]?.get("created_at") as Timestamp | undefined)?.toMillis() ?? 0;
  if (Date.now() - lastAt < COOLDOWN_MS) return fail("Tunggu 1 jam sejak broadcast terakhir.");

  const integrations = await adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get();
  const provider = integrations.get("wa_api_provider");
  const token = integrations.get("wa_api_token");
  if (!provider || !token) return fail("Atur provider & token WhatsApp di Pengaturan dulu.");

  let q = adminDb.collection("orders").where("store_id", "==", storeId).where("payment_status", "==", "PAID");
  if (input.productId) q = q.where("product_id", "==", input.productId);
  const orders = await q.select("customer_contact").get();
  const phones = [...new Set(orders.docs.map((d) => waNumber(d.get("customer_contact.phone") ?? "")).filter(Boolean))].slice(0, MAX_RECIPIENTS);
  if (phones.length === 0) return fail("Belum ada pembeli untuk dikirimi.");

  const ref = adminDb.collection("broadcasts").doc();
  const text = fillTemplate(message, { store: store.store_name });
  let error: string | null = null;
  try {
    await postToN8n({ event: "broadcast", broadcast_id: ref.id, store_id: storeId, recipients: phones, message: text, wa: waPayload(integrations) });
  } catch (err) {
    error = err instanceof Error ? err.message : "n8n error";
  }
  await ref.create({
    store_id: storeId,
    message: text,
    audience: input.productId ? "product" : "all",
    product_id: input.productId,
    recipients: phones.length,
    status: error ? "FAILED" : "SENT",
    error,
    created_at: FieldValue.serverTimestamp(),
  });
  revalidatePath(`/${storeId}/marketing`);
  if (error) return fail(`Broadcast gagal dikirim ke n8n: ${error}`);
  return { ok: true, data: { recipients: phones.length } };
}
