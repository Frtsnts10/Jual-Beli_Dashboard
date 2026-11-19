"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requirePlatformAdmin, isAdminEmail } from "@/lib/access/platform";
import { fail, type ActionResult } from "@/lib/action-result";
import { cleanOverrides, FEATURE_KEYS, FONTS, PLAN_KEYS, RADIUS, type FeatureKey, type FeatureOverrides, type FontKey, type RadiusKey } from "@/lib/catalog-core";
import { TEMPLATES } from "@/config/tiers";
import type { LayoutTemplate, SubscriptionTier } from "@/types/schema";

const catalogRef = () => adminDb.collection("platform").doc("catalog");
const isTemplate = (t: string): t is LayoutTemplate => TEMPLATES.some((x) => x.id === t);

async function audit(action: string, target: string, by: string, details: Record<string, unknown>) {
  await adminDb.collection("platform_audit").add({ action, target, by, details, at: FieldValue.serverTimestamp() });
}

/** Limits: a whole number ≥ 1, or null for unlimited. */
const limitOk = (v: number | null) => v === null || (Number.isInteger(v) && v >= 1 && v <= 1_000_000);

export interface PlanInput {
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxStores: number | null;
  maxCredentials: number | null;
  templates: LayoutTemplate[];
  features: Record<FeatureKey, boolean>;
}

/** Admin → Paket: what one plan costs and includes. */
export async function savePlan(tier: SubscriptionTier, input: PlanInput): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!PLAN_KEYS.includes(tier)) return fail("Paket tidak dikenal.");
  const name = input.name.trim().slice(0, 30);
  if (name.length < 2) return fail("Nama paket minimal 2 huruf.");
  for (const v of [input.priceMonthly, input.priceYearly]) if (!Number.isInteger(v) || v < 0 || v > 100_000_000) return fail("Harga tidak valid.");
  if (tier === "starter" && (input.priceMonthly || input.priceYearly)) return fail("Starter adalah paket gratis; harganya harus 0.");
  if (tier !== "starter" && (input.priceMonthly < 1_000 || input.priceYearly < 1_000)) return fail("Harga paket berbayar minimal Rp 1.000.");
  if (!limitOk(input.maxStores) || !limitOk(input.maxCredentials)) return fail("Batas harus angka ≥ 1, atau tanpa batas.");
  const templates = [...new Set(input.templates.filter(isTemplate))];
  if (!templates.length) return fail("Pilih minimal satu template.");
  const plan = {
    name,
    priceMonthly: input.priceMonthly,
    priceYearly: input.priceYearly,
    maxStores: input.maxStores,
    maxCredentials: input.maxCredentials,
    templates,
    ...Object.fromEntries(FEATURE_KEYS.map((k) => [k, !!input.features[k]])),
  };
  await catalogRef().set({ plans: { [tier]: plan }, updated_at: FieldValue.serverTimestamp() }, { merge: true });
  await audit("catalog.plan", tier, admin.email, plan);
  revalidatePath("/", "layout");
  return { ok: true };
}

export interface TemplateInput {
  enabled: boolean;
  name: string;
  description: string;
  radius: RadiusKey | null;
  font: FontKey | null;
  accent: string | null;
}

/** Admin → Tema: offer or withdraw a storefront template, rename it, adjust its look. */
export async function saveTemplate(id: LayoutTemplate, input: TemplateInput): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!isTemplate(id)) return fail("Template tidak dikenal.");
  const name = input.name.trim().slice(0, 40);
  const description = input.description.trim().slice(0, 160);
  if (name.length < 2) return fail("Nama template minimal 2 huruf.");
  if (input.radius !== null && !(input.radius in RADIUS)) return fail("Pilihan sudut tidak dikenal.");
  if (input.font !== null && !(input.font in FONTS)) return fail("Pilihan font tidak dikenal.");
  if (input.accent !== null && !/^#[0-9a-fA-F]{6}$/.test(input.accent)) return fail("Warna harus format #RRGGBB.");
  if (!input.enabled) {
    const doc = (await catalogRef().get()).data()?.templates ?? {};
    const stillOn = TEMPLATES.filter((t) => t.id !== id && doc[t.id]?.enabled !== false);
    if (!stillOn.length) return fail("Minimal satu template harus tetap aktif.");
  }
  const tpl = { enabled: input.enabled, name, description, style: { radius: input.radius, font: input.font, accent: input.accent } };
  await catalogRef().set({ templates: { [id]: tpl }, updated_at: FieldValue.serverTimestamp() }, { merge: true });
  await audit("catalog.template", id, admin.email, tpl);
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Admin → Pengguna → Fitur khusus: give or take features from one seller, beyond their plan. */
export async function setFeatureOverrides(uid: string, input: FeatureOverrides): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const ref = adminDb.collection("users").doc(uid);
  const user = await ref.get();
  if (!user.exists) return fail("Pengguna tidak ditemukan.");
  if (isAdminEmail(user.get("email") ?? "")) return fail("Akun admin tidak memakai fitur seller.");
  if ((input.maxStores !== undefined && !limitOk(input.maxStores)) || (input.maxCredentials !== undefined && !limitOk(input.maxCredentials))) {
    return fail("Batas harus angka ≥ 1, atau tanpa batas.");
  }
  const clean = cleanOverrides(input);
  await ref.update({ feature_overrides: Object.keys(clean).length ? clean : FieldValue.delete() });
  await audit("user.features", uid, admin.email, { ...clean });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Admin → Tema → Tema AI: the platform-wide switch and the monthly designs per seller. */
export async function saveAiSettings(input: { enabled: boolean; monthlyLimit: number }): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  if (!Number.isInteger(input.monthlyLimit) || input.monthlyLimit < 1 || input.monthlyLimit > 100) return fail("Jatah per bulan 1–100.");
  const ai = { enabled: !!input.enabled, monthlyLimit: input.monthlyLimit };
  await catalogRef().set({ ai, updated_at: FieldValue.serverTimestamp() }, { merge: true });
  await audit("catalog.ai", "ai", admin.email, ai);
  revalidatePath("/", "layout");
  return { ok: true };
}
