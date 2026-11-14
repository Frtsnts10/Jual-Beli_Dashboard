"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { TIERS } from "@/config/tiers";
import { addDomain, inspectDomain, removeDomain, vercelDomainsEnabled } from "@/lib/vercel-domains";

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

function normalise(raw: string) {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.$/, "").replace(/^www\./, "");
}

/**
 * Step 1 of the custom-domain flow: reserve the domain for this store and attach it to the
 * storefront project. The store answers on it as soon as DNS points at Vercel; the
 * "Cek sekarang" step (checkDomain) confirms every link of that chain.
 */
export async function connectDomain(storeId: string, raw: string): Promise<ActionResult> {
  const { store, tier } = await requireStore(storeId, { ownerOnly: true });
  if (!TIERS[tier].customDomain) return fail("Domain sendiri adalah fitur paket Ultimate.");
  if (store.custom_domain) return fail("Hapus domain yang sekarang dulu sebelum menambah yang baru.");

  const domain = normalise(raw);
  if (!DOMAIN_RE.test(domain)) return fail("Format domain tidak valid. Contoh: tokoku.com atau shop.tokoku.com");
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  if (root && (domain === root || domain.endsWith(`.${root}`))) return fail("Gunakan domain milik Anda sendiri, bukan domain platform.");

  const indexRef = adminDb.collection("store_domains").doc(domain);
  if ((await indexRef.get()).exists) return fail("Domain ini sudah dipakai toko lain.");

  if (vercelDomainsEnabled()) {
    try {
      await addDomain(domain);
    } catch (err) {
      return fail(`Domain ditolak: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  try {
    await adminDb.runTransaction(async (tx) => {
      if ((await tx.get(indexRef)).exists) throw new Error("DOMAIN_TAKEN");
      tx.create(indexRef, { store_id: storeId });
      tx.update(adminDb.collection("stores").doc(storeId), {
        custom_domain: domain,
        custom_domain_status: { state: "pending", checks: { attached: vercelDomainsEnabled(), dns: false, live: false }, message: null, checked_at: null },
      });
    });
  } catch (err) {
    if (vercelDomainsEnabled()) await removeDomain(domain).catch(() => {});
    if (err instanceof Error && err.message === "DOMAIN_TAKEN") return fail("Domain ini sudah dipakai toko lain.");
    throw err;
  }
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}

export async function disconnectDomain(storeId: string): Promise<ActionResult> {
  const { store } = await requireStore(storeId, { ownerOnly: true });
  if (!store.custom_domain) return { ok: true };
  if (vercelDomainsEnabled()) {
    await removeDomain(store.custom_domain).catch((err) => console.error("Vercel domain removal failed:", err));
  }
  const batch = adminDb.batch();
  batch.delete(adminDb.collection("store_domains").doc(store.custom_domain));
  batch.update(adminDb.collection("stores").doc(storeId), { custom_domain: null, custom_domain_status: FieldValue.delete() });
  await batch.commit();
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}

/** Fetches the storefront's identity endpoint through the seller's domain, over HTTPS. */
async function liveCheck(domain: string, storeId: string) {
  // Tests point this at a local storefront; production always goes through real DNS + TLS.
  const base = process.env.DOMAIN_CHECK_BASE;
  const url = base ? `${base}/.well-known/store-check?host=${encodeURIComponent(domain)}` : `https://${domain}/.well-known/store-check`;
  try {
    const res = await fetch(url, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(8000) });
    const data = (await res.json().catch(() => ({}))) as { store_id?: string };
    if (data.store_id === storeId) return { ok: true, message: null };
    return { ok: false, message: res.ok ? "Domain terbuka, tapi menampilkan situs lain." : `Situs merespons ${res.status}.` };
  } catch {
    return { ok: false, message: "Belum bisa dibuka lewat HTTPS (DNS belum aktif atau sertifikat SSL masih diproses)." };
  }
}

/**
 * Steps 2–3: confirm DNS points at the storefront and that https://<domain> really serves
 * *this* store. The domain is marked active only when every check passes.
 */
export async function checkDomain(storeId: string): Promise<ActionResult<{ active: boolean }>> {
  const { store } = await requireStore(storeId);
  const domain = store.custom_domain;
  if (!domain) return fail("Belum ada domain.");

  let attached = true;
  let dns = true;
  let message: string | null = null;
  if (vercelDomainsEnabled()) {
    const state = await inspectDomain(domain).catch(() => null);
    attached = !!state;
    dns = !!state && state.verified && !state.misconfigured;
    if (!state) message = "Domain belum terdaftar di platform. Hapus lalu hubungkan ulang.";
    else if (!state.verified) message = "Tambahkan record TXT verifikasi di bawah.";
    else if (state.misconfigured) message = "Record DNS belum mengarah ke kami (bisa butuh 5 menit–24 jam).";
  }
  const live = attached && dns ? await liveCheck(domain, storeId) : { ok: false, message: null };
  if (!message) message = live.message;

  const active = attached && dns && live.ok;
  await adminDb.collection("stores").doc(storeId).update({
    custom_domain_status: { state: active ? "active" : "pending", checks: { attached, dns, live: live.ok }, message, checked_at: FieldValue.serverTimestamp() },
  });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true, data: { active } };
}
