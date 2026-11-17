"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { isImageUrl } from "@/lib/media-kinds";
import type { HeroSlide } from "@/types/schema";

const MAX_SLIDES = 5;

/** Replaces the store's hero slides (order = display order). */
export async function saveHeroSlides(storeId: string, slides: HeroSlide[]): Promise<ActionResult> {
  await requireStore(storeId);
  if (slides.length > MAX_SLIDES) return fail(`Maksimal ${MAX_SLIDES} slide.`);
  const productIds = new Set((await adminDb.collection("products").where("store_id", "==", storeId).select().get()).docs.map((d) => d.id));
  const clean: HeroSlide[] = [];
  for (const [i, s] of slides.entries()) {
    const n = i + 1;
    if (!s.image_url || !isImageUrl(s.image_url)) return fail(`Slide ${n}: unggah gambar banner dulu.`);
    if (s.image_mobile_url && !isImageUrl(s.image_mobile_url)) return fail(`Slide ${n}: gambar versi HP tidak valid.`);
    const target = (s.cta_target ?? "").trim();
    if (target && !productIds.has(target) && !/^https:\/\//.test(target)) return fail(`Slide ${n}: tujuan tombol harus produk toko ini atau link https://`);
    if (s.cta_label.trim() && !target) return fail(`Slide ${n}: pilih tujuan tombol.`);
    clean.push({
      id: /^[a-z0-9]{6,20}$/.test(s.id) ? s.id : Math.random().toString(36).slice(2, 12),
      image_url: s.image_url,
      image_mobile_url: s.image_mobile_url || null,
      title: s.title.trim().slice(0, 80),
      subtitle: s.subtitle.trim().slice(0, 160),
      cta_label: s.cta_label.trim().slice(0, 30),
      cta_target: target,
      active: !!s.active,
    });
  }
  await adminDb.collection("stores").doc(storeId).update({ hero_slides: clean });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}
