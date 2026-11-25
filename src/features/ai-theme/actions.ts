"use server";

import { demoBlocked } from "@/lib/access/demo";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { getCatalog, FONTS, RADIUS } from "@/lib/catalog";
import { aiConfigured, designTheme, type AiThemeDesign } from "@/lib/ai/theme";
import { fail, type ActionResult } from "@/lib/action-result";

const HEX = /^#[0-9a-fA-F]{6}$/;
/** Calendar month in Jakarta time, e.g. "2026-11": the quota resets on the 1st. */
const month = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }).slice(0, 7);

export interface AiThemeStatus {
  /** null = available; otherwise why the button is off. */
  blocked: null | "platform_off" | "not_configured" | "plan";
  used: number;
  limit: number;
}

async function statusFor(storeId: string, readOnly = false): Promise<AiThemeStatus & { features: Awaited<ReturnType<typeof requireStore>>["features"] }> {
  const { features } = await requireStore(storeId, { allowSuspended: readOnly });
  const { ai } = await getCatalog();
  const snap = await adminDb.collection("stores").doc(storeId).get();
  const usage = snap.get("ai_theme_usage") as { month?: string; count?: number } | undefined;
  const used = usage?.month === month() ? (usage.count ?? 0) : 0;
  const blocked = !ai.enabled ? "platform_off" : !aiConfigured() ? "not_configured" : !features.aiTheme ? "plan" : null;
  return { blocked, used, limit: ai.monthlyLimit, features };
}

export async function getAiThemeStatus(storeId: string): Promise<AiThemeStatus> {
  const { blocked, used, limit } = await statusFor(storeId, true);
  return { blocked, used, limit };
}

/** Uses one of the month's designs and asks Claude for a theme; nothing is saved until applied. */
export async function generateAiTheme(storeId: string, brief: string): Promise<ActionResult<{ design: AiThemeDesign; used: number; limit: number }>> {
  const demo = await demoBlocked();
  if (demo) return demo;
  const { blocked, limit, features } = await statusFor(storeId);
  if (blocked === "platform_off") return fail("Tema AI sedang dimatikan admin platform.");
  if (blocked === "not_configured") return fail("Tema AI belum disiapkan admin platform.");
  if (blocked === "plan") return fail("Tema AI belum tersedia di paket Anda.");

  // Reserve one use first, in a transaction, so parallel clicks can't go over the limit.
  const ref = adminDb.collection("stores").doc(storeId);
  const m = month();
  let used = 0;
  try {
    used = await adminDb.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      const u = s.get("ai_theme_usage") as { month?: string; count?: number } | undefined;
      const count = u?.month === m ? (u.count ?? 0) : 0;
      if (count >= limit) throw new Error("LIMIT");
      tx.update(ref, { ai_theme_usage: { month: m, count: count + 1 } });
      return count + 1;
    });
  } catch (err) {
    if ((err as Error).message === "LIMIT") return fail(`Jatah Tema AI bulan ini (${limit}x) sudah habis. Coba lagi bulan depan.`);
    throw err;
  }

  const [store, products, catalog] = await Promise.all([
    ref.get(),
    adminDb.collection("products").where("store_id", "==", storeId).select("title").limit(40).get(),
    getCatalog(),
  ]);
  const templates = catalog.templates
    .filter((t) => features.templates.includes(t.id))
    .map((t) => ({ id: t.id, name: t.name, description: t.description }));

  let design: AiThemeDesign | null = null;
  try {
    design = await designTheme({
      storeName: store.get("store_name") ?? "",
      tagline: store.get("storefront_config.tagline") ?? "",
      products: products.docs.map((p) => String(p.get("title") ?? "")).filter(Boolean),
      brief: brief.trim().slice(0, 500),
      templates,
    });
  } catch (err) {
    console.error("AI theme generation failed", err);
  }
  if (!design) {
    // The use wasn't delivered: give it back.
    await adminDb.runTransaction(async (tx) => {
      const s = await tx.get(ref);
      const u = s.get("ai_theme_usage") as { month?: string; count?: number } | undefined;
      if (u?.month === m && (u.count ?? 0) > 0) tx.update(ref, { ai_theme_usage: { month: m, count: (u.count ?? 1) - 1 } });
    });
    return fail("AI belum bisa membuat tema saat ini. Coba lagi sebentar lagi, atau ubah deskripsinya.");
  }
  return { ok: true, data: { design, used, limit } };
}

/** Applies a generated design: template, accent, tagline, corners, font and the "Tentang" text. */
export async function applyAiTheme(storeId: string, d: AiThemeDesign): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  const { features } = await requireStore(storeId);
  // The design came back through the browser: check every field again.
  if (!features.templates.includes(d.template)) return fail("Template ini tidak tersedia di paket Anda.");
  if (!HEX.test(d.accent) || !(d.radius in RADIUS) || !(d.font in FONTS)) return fail("Desain tidak valid.");
  await adminDb
    .collection("stores")
    .doc(storeId)
    .update({
      "storefront_config.layout_template": d.template,
      "storefront_config.accent_color": d.accent,
      "storefront_config.tagline": String(d.tagline).slice(0, 160),
      "store_info.about": String(d.about).slice(0, 800),
      theme_override: { radius: d.radius, font: d.font, source: "ai" },
    });
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}

/** Back to the template's own corners and font (keeps template, colour and texts). */
export async function clearThemeOverride(storeId: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  await adminDb.collection("stores").doc(storeId).update({ theme_override: null });
  revalidatePath(`/${storeId}`, "layout");
  return { ok: true };
}
