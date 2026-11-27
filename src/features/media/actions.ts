"use server";

import { demoBlocked } from "@/lib/access/demo";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { saveImage } from "@/lib/media";
import type { MediaKind } from "@/lib/media-kinds";

/** Uploads a logo / banner / product photo (compressed in the browser first). */
export async function uploadStoreImage(storeId: string, kind: MediaKind, dataUrl: string): Promise<ActionResult<{ url: string }>> {
  const demo = await demoBlocked();
  if (demo) return demo;
  await requireStore(storeId);
  if (!["logo", "banner", "product"].includes(kind)) return fail("Jenis gambar tidak dikenal.");
  try {
    return { ok: true, data: { url: await saveImage(storeId, kind, dataUrl) } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    console.warn("uploadStoreImage", kind, msg || err);
    if (msg === "BAD_IMAGE") return fail("Gambar tidak valid. Pakai JPG, PNG atau WebP.");
    if (msg === "TOO_BIG") return fail("Gambar terlalu besar setelah dikompres (maks 2,5 MB).");
    console.error("uploadStoreImage", err);
    return fail("Penyimpanan gambar belum siap. Pastikan Firebase Storage sudah diaktifkan (paket Blaze).");
  }
}
