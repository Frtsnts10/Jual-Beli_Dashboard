"use server";

import { requirePlatformAdmin } from "@/lib/access/platform";
import { authDomainsEnabled, syncAllStoreDomains } from "@/lib/integrations/firebase-auth-domains";
import { fail, type ActionResult } from "@/lib/action-result";

/** Admin → Ringkasan: register every store's subdomain/custom domain for Google sign-in. */
export async function syncStoreAuthDomains(): Promise<ActionResult<{ hosts: number }>> {
  await requirePlatformAdmin();
  if (!authDomainsEnabled()) return fail("Butuh FIREBASE_PRIVATE_KEY (service account) di env Vercel dashboard.");
  try {
    return { ok: true, data: { hosts: await syncAllStoreDomains() } };
  } catch (err) {
    console.error("sync authorized domains failed", err);
    return fail("Gagal memperbarui Authorized domains Firebase. Pastikan service account punya role Firebase Authentication Admin.");
  }
}
