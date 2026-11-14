"use server";

import { headers } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { randomId } from "@/lib/ids";
import { createInvoice } from "@/lib/xendit";
import { TIERS } from "@/config/tiers";
import type { BillingPeriod, SubscriptionTier } from "@/types/schema";

/** Starts a plan purchase: records a PENDING payment and returns the Xendit invoice URL to pay it. */
export async function startSubscription(
  storeId: string,
  tier: Exclude<SubscriptionTier, "starter">,
  period: BillingPeriod
): Promise<ActionResult<{ url: string }>> {
  const { user } = await requireStore(storeId, { ownerOnly: true });
  if (!(tier === "pro" || tier === "ultimate")) return fail("Paket tidak dikenal.");
  if (!(period === "monthly" || period === "yearly")) return fail("Periode tidak dikenal.");
  if (!process.env.XENDIT_SECRET_KEY) return fail("Pembayaran langganan belum dikonfigurasi (XENDIT_SECRET_KEY).");

  const config = TIERS[tier];
  const amount = period === "yearly" ? config.priceYearly : config.priceMonthly;
  const id = randomId("SUB");
  const ref = adminDb.collection("subscription_payments").doc(id);
  await ref.create({
    uid: user.uid,
    tier,
    period,
    amount,
    status: "PENDING",
    xendit_invoice_id: null,
    xendit_invoice_url: null,
    created_at: FieldValue.serverTimestamp(),
    paid_at: null,
  });

  const h = await headers();
  const back = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/${storeId}/billing`;
  try {
    const invoice = await createInvoice({
      external_id: id,
      amount,
      description: `Paket ${config.name} (${period === "yearly" ? "tahunan" : "bulanan"})`,
      payer_email: user.email,
      success_redirect_url: `${back}?paid=${id}`,
      failure_redirect_url: back,
    });
    await ref.update({ xendit_invoice_id: invoice.id, xendit_invoice_url: invoice.invoice_url });
    return { ok: true, data: { url: invoice.invoice_url } };
  } catch (err) {
    console.error("Subscription invoice failed:", err);
    await ref.update({ status: "EXPIRED" });
    return fail("Gagal membuat tagihan. Coba lagi nanti.");
  }
}
