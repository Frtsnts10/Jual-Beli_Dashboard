"use server";

import { revalidatePath } from "next/cache";
import { notify, platformAdminUids } from "@/lib/notify";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { randomId } from "@/lib/ids";
import { getPlatformQris } from "@/lib/data/platform-settings";
import { getCatalog } from "@/lib/catalog";
import type { BillingPeriod, SubscriptionTier } from "@/types/schema";

/** Sellers have a day to pay a plan purchase and upload the proof. */
const PAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/**
 * Starts a plan purchase paid to the platform's QRIS: records a PENDING payment with a
 * kode unik (so the admin can match the transfer) and shows it on the Langganan page.
 * An unpaid purchase for the same plan and period is reused instead of piling up.
 */
export async function startSubscription(
  storeId: string,
  tier: Exclude<SubscriptionTier, "starter">,
  period: BillingPeriod,
): Promise<ActionResult<{ id: string }>> {
  const { user } = await requireStore(storeId, { ownerOnly: true });
  if (!(tier === "pro" || tier === "ultimate"))
    return fail("Paket tidak dikenal.");
  if (!(period === "monthly" || period === "yearly"))
    return fail("Periode tidak dikenal.");
  if (!(await getPlatformQris()))
    return fail(
      "Pembelian paket sedang ditutup sementara (admin platform belum memasang QRIS pembayaran). Coba lagi nanti.",
    );

  const plan = (await getCatalog()).plans[tier];
  const base = period === "yearly" ? plan.priceYearly : plan.priceMonthly;
  if (base < 1_000) return fail("Paket ini belum bisa dibeli. Hubungi admin platform.");
  const pending = await adminDb
    .collection("subscription_payments")
    .where("status", "==", "PENDING")
    .get();
  const now = Date.now();
  const mine = pending.docs.find(
    (d) =>
      d.get("uid") === user.uid &&
      d.get("tier") === tier &&
      d.get("period") === period &&
      (d.get("proof_uploaded_at") ||
        (d.get("pay_by")?.toMillis?.() ?? 0) > now),
  );
  if (mine) return { ok: true, data: { id: mine.id } };

  const taken = new Set(pending.docs.map((d) => d.get("amount") as number));
  let code = 1 + Math.floor(Math.random() * 499);
  for (let i = 0; i < 50 && taken.has(base + code); i++)
    code = 1 + Math.floor(Math.random() * 499);
  const id = randomId("SUB");
  await adminDb
    .collection("subscription_payments")
    .doc(id)
    .create({
      uid: user.uid,
      email: user.email,
      store_id: storeId,
      tier,
      period,
      amount: base + code,
      unique_code: code,
      status: "PENDING",
      pay_by: Timestamp.fromMillis(now + PAY_WINDOW_MS),
      proof_uploaded_at: null,
      rejected_reason: null,
      created_at: FieldValue.serverTimestamp(),
      paid_at: null,
    });
  revalidatePath(`/${storeId}/billing`);
  return { ok: true, data: { id } };
}

/** The seller's screenshot of the transfer; a platform admin confirms it in /platform/payments. */
export async function uploadSubscriptionProof(
  storeId: string,
  paymentId: string,
  image: string,
): Promise<ActionResult> {
  const { user } = await requireStore(storeId, { ownerOnly: true });
  if (image.length > 950_000 || !DATA_URL_RE.test(image))
    return fail(
      "Gambar tidak valid atau terlalu besar. Unggah screenshot JPG/PNG.",
    );
  const ref = adminDb.collection("subscription_payments").doc(paymentId);
  const error = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get("uid") !== user.uid)
      return "Pembayaran tidak ditemukan.";
    if (snap.get("status") !== "PENDING")
      return "Pembayaran ini sudah tidak menunggu bukti.";
    if (
      !snap.get("proof_uploaded_at") &&
      (snap.get("pay_by")?.toMillis?.() ?? 0) < Date.now()
    )
      return "Batas waktu pembayaran sudah lewat. Pilih paket lagi.";
    tx.set(adminDb.collection("payment_proofs").doc(paymentId), {
      uid: user.uid,
      image,
      uploaded_at: FieldValue.serverTimestamp(),
    });
    tx.update(ref, { proof_uploaded_at: FieldValue.serverTimestamp() });
    return null;
  });
  if (error) return fail(error);
  await notify(await platformAdminUids(), {
    type: "admin_payment",
    title: "Bukti pembayaran paket masuk",
    body: `${user.email} · ${paymentId} — cek mutasi QRIS lalu konfirmasi.`,
    href: "/platform/payments",
  });
  revalidatePath(`/${storeId}/billing`);
  return { ok: true };
}

export async function cancelSubscriptionPayment(
  storeId: string,
  paymentId: string,
): Promise<ActionResult> {
  const { user } = await requireStore(storeId, { ownerOnly: true });
  const ref = adminDb.collection("subscription_payments").doc(paymentId);
  const snap = await ref.get();
  if (
    !snap.exists ||
    snap.get("uid") !== user.uid ||
    snap.get("status") !== "PENDING"
  )
    return fail("Pembayaran tidak ditemukan.");
  await ref.update({ status: "EXPIRED" });
  revalidatePath(`/${storeId}/billing`);
  return { ok: true };
}

/**
 * Back to Starter right away (the remaining paid days are given up — the page says so and asks
 * to confirm). Waiting for the expiry date does the same without losing anything.
 */
export async function switchToStarter(storeId: string): Promise<ActionResult> {
  const { user } = await requireStore(storeId, { ownerOnly: true });
  await adminDb
    .collection("users")
    .doc(user.uid)
    .update({ subscription_tier: "starter", subscription_expiry: null });
  revalidatePath("/", "layout");
  return { ok: true };
}
