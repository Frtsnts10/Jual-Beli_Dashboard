"use server";

import { isImageUrl } from "@/lib/media-kinds";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { getOwnedStores, requireStore, requireUser } from "@/lib/access/auth";
import { isPlatformAdmin } from "@/lib/access/platform";
import { fail, type ActionResult } from "@/lib/action-result";
import { DEFAULT_WA_TEMPLATE, TEMPLATES } from "@/config/tiers";
import { featuresOfUid } from "@/lib/catalog";
import { waNumber } from "@/lib/integrations/whatsapp";
import type { LayoutTemplate, StoreInfo, WaProvider } from "@/types/schema";

const RESERVED_SLUGS = new Set(["www", "app", "api", "admin", "dashboard", "mail", "static", "assets", "track", "checkout"]);
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function validateSlug(slug: string) {
  if (!SLUG_RE.test(slug)) return "Slug 3–40 karakter: huruf kecil, angka dan tanda hubung.";
  if (RESERVED_SLUGS.has(slug)) return "Slug ini dipakai sistem, pilih yang lain.";
  return null;
}

export async function createStore(input: { store_name: string; slug: string }): Promise<ActionResult<{ storeId: string }>> {
  const user = await requireUser();
  if (await isPlatformAdmin()) return fail("Akun admin platform tidak bisa membuat toko. Daftar dengan email lain untuk berjualan.");
  const storeName = input.store_name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (storeName.length < 2) return fail("Nama toko terlalu pendek.");
  const slugError = validateSlug(slug);
  if (slugError) return fail(slugError);

  const tier = await featuresOfUid(user.uid);
  const owned = await getOwnedStores(user.uid);
  if (owned.length >= tier.maxStores) {
    return fail(`Paket ${tier.name} maksimal ${tier.maxStores} toko. Upgrade untuk menambah toko.`);
  }

  const storeRef = adminDb.collection("stores").doc();
  const slugRef = adminDb.collection("store_slugs").doc(slug);
  try {
    await adminDb.runTransaction(async (tx) => {
      if ((await tx.get(slugRef)).exists) throw new Error("SLUG_TAKEN");
      tx.create(slugRef, { store_id: storeRef.id });
      tx.create(storeRef, {
        owner_uid: user.uid,
        store_name: storeName,
        slug,
        custom_domain: null,
        payment: null,
        storefront_config: { layout_template: "template_c_hero", accent_color: "#10B981", tagline: "" },
        is_active: true,
        created_at: FieldValue.serverTimestamp(),
      });
      tx.create(storeRef.collection("private").doc("integrations"), {
        wa_api_provider: null,
        wa_api_token: null,
        wa_message_template: DEFAULT_WA_TEMPLATE,
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SLUG_TAKEN") return fail("Slug sudah dipakai toko lain.");
    throw err;
  }
  revalidatePath("/", "layout");
  return { ok: true, data: { storeId: storeRef.id } };
}

export interface StoreSettingsInput {
  store_name: string;
  slug: string;
  is_active: boolean;
  layout_template: LayoutTemplate;
  accent_color: string;
  tagline: string;
  banner_url: string;
  logo_url: string;
}

export async function updateStoreSettings(storeId: string, input: StoreSettingsInput): Promise<ActionResult> {
  const { store, features: tier } = await requireStore(storeId);

  const storeName = input.store_name.trim();
  if (storeName.length < 2) return fail("Nama toko terlalu pendek.");
  const slug = input.slug.trim().toLowerCase();
  const slugError = validateSlug(slug);
  if (slugError) return fail(slugError);
  if (!TEMPLATES.some((t) => t.id === input.layout_template)) return fail("Template tidak dikenal.");
  if (input.layout_template !== store.storefront_config.layout_template && !tier.templates.includes(input.layout_template)) {
    return fail(`Template ini tidak tersedia di paket ${tier.name}.`);
  }
  if (!HEX_RE.test(input.accent_color)) return fail("Warna aksen harus format hex, mis. #10B981.");
  for (const url of [input.banner_url, input.logo_url]) {
    if (url && !isImageUrl(url)) return fail("URL gambar harus diawali https://");
  }

  const storeRef = adminDb.collection("stores").doc(storeId);
  try {
    await adminDb.runTransaction(async (tx) => {
      const newSlugRef = adminDb.collection("store_slugs").doc(slug);
      const slugSnap = slug !== store.slug ? await tx.get(newSlugRef) : null;
      if (slugSnap?.exists) throw new Error("SLUG_TAKEN");

      if (slug !== store.slug) {
        tx.delete(adminDb.collection("store_slugs").doc(store.slug));
        tx.create(newSlugRef, { store_id: storeId });
      }
      tx.update(storeRef, {
        store_name: storeName,
        slug,
        is_active: input.is_active,
        storefront_config: {
          layout_template: input.layout_template,
          accent_color: input.accent_color,
          tagline: input.tagline.trim().slice(0, 160),
          banner_url: input.banner_url.trim(),
          logo_url: input.logo_url.trim(),
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SLUG_TAKEN") return fail("Slug sudah dipakai toko lain.");
    throw err;
  }
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}

const MAX_FAQ = 20;

/** Saves the storefront's info pages (Tentang, FAQ, Kebijakan garansi) and the WhatsApp chat number. */
export async function updateStoreInfo(storeId: string, input: StoreInfo): Promise<ActionResult> {
  await requireStore(storeId);
  const about = input.about.trim().slice(0, 4000);
  const warranty = input.warranty_policy.trim().slice(0, 4000);
  const faq = input.faq
    .map((f) => ({ q: f.q.trim().slice(0, 200), a: f.a.trim().slice(0, 1500) }))
    .filter((f) => f.q && f.a);
  if (faq.length > MAX_FAQ) return fail(`Maksimal ${MAX_FAQ} pertanyaan FAQ.`);

  let whatsapp = "";
  if (input.whatsapp.trim()) {
    const digits = waNumber(input.whatsapp);
    if (!/^628\d{7,12}$/.test(digits)) return fail("Nomor WhatsApp tidak valid (contoh: 0812xxxxxxx).");
    whatsapp = `+${digits}`;
  }

  await adminDb.collection("stores").doc(storeId).update({ store_info: { about, faq, warranty_policy: warranty, whatsapp } });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}

export async function updateIntegrations(
  storeId: string,
  input: { wa_api_provider: WaProvider | ""; wa_api_token: string; wa_phone_number_id?: string; wa_server?: string; wa_message_template: string }
): Promise<ActionResult> {
  await requireStore(storeId);
  const phoneNumberId = (input.wa_phone_number_id ?? "").trim();
  const server = (input.wa_server ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (input.wa_api_provider === "meta" && !/^\d{6,20}$/.test(phoneNumberId)) return fail("Isi Phone Number ID dari Meta (angka, lihat WhatsApp → API Setup).");
  if (input.wa_api_provider === "wablas" && !/^[a-z0-9-]+\.wablas\.com$/.test(server)) return fail("Isi server Wablas Anda, mis. tegal.wablas.com.");
  const ref = adminDb.collection("stores").doc(storeId).collection("private").doc("integrations");
  await ref.set(
    {
      wa_api_provider: input.wa_api_provider || null,
      // An empty token field means "keep the saved one" — the form never receives it back.
      ...(input.wa_api_token.trim() ? { wa_api_token: input.wa_api_token.trim() } : {}),
      wa_phone_number_id: input.wa_api_provider === "meta" ? phoneNumberId : null,
      wa_server: input.wa_api_provider === "wablas" ? server : null,
      wa_message_template: input.wa_message_template.trim() || DEFAULT_WA_TEMPLATE,
    },
    { merge: true }
  );
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}

/** Pengaturan → WhatsApp & Bot → Notifikasi pembayaran. An empty seller phone turns that alert off. */
export async function updateWaNotifications(storeId: string, input: { buyer: boolean; sellerPhone: string }): Promise<ActionResult> {
  await requireStore(storeId);
  const raw = input.sellerPhone.replace(/[\s-]/g, "");
  let phone: string | null = null;
  if (raw) {
    const digits = raw.replace(/^\+/, "");
    if (!/^(0|62)8\d{7,12}$/.test(digits)) return fail("Nomor WhatsApp tidak valid (contoh: 0812xxxxxxx).");
    phone = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  }
  await adminDb
    .collection("stores")
    .doc(storeId)
    .collection("private")
    .doc("integrations")
    .set({ wa_notify_buyer: !!input.buyer, wa_notify_seller_phone: phone }, { merge: true });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}
