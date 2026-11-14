"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { createManagedAccount, getAccount, XenditError } from "@/lib/payments/xendit";

const integrationsRef = (storeId: string) => adminDb.collection("stores").doc(storeId).collection("private").doc("integrations");

/**
 * XenPlatform onboarding (plan §4): creates a MANAGED sub-account for the store. Xendit
 * emails the seller an invitation to finish KYC; once the account is LIVE, checkout pays
 * into it and the platform fee is split to the master account.
 */
export async function connectXendit(storeId: string): Promise<ActionResult> {
  const { user, store } = await requireStore(storeId, { ownerOnly: true });
  if (!process.env.XENDIT_SECRET_KEY) return fail("Integrasi Xendit platform belum dikonfigurasi.");

  const existing = await integrationsRef(storeId).get();
  if (existing.get("xendit_sub_account_id")) return fail("Toko ini sudah terhubung ke Xendit.");

  try {
    const account = await createManagedAccount(user.email, store.store_name);
    await integrationsRef(storeId).set(
      { xendit_sub_account_id: account.id, xendit_account_status: account.status },
      { merge: true }
    );
  } catch (err) {
    console.error("Xendit account creation failed:", err);
    if (err instanceof XenditError && err.status === 400) {
      return fail("Xendit menolak pendaftaran (email mungkin sudah terdaftar di Xendit). Hubungi admin platform.");
    }
    return fail("Gagal menghubungkan Xendit. Coba lagi nanti.");
  }
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}

export async function refreshXenditStatus(storeId: string): Promise<ActionResult> {
  await requireStore(storeId, { ownerOnly: true });
  const id = (await integrationsRef(storeId).get()).get("xendit_sub_account_id");
  if (!id) return fail("Toko belum terhubung ke Xendit.");
  try {
    const account = await getAccount(id);
    await integrationsRef(storeId).set({ xendit_account_status: account.status }, { merge: true });
  } catch (err) {
    console.error("Xendit account lookup failed:", err);
    return fail("Gagal membaca status akun Xendit.");
  }
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}
