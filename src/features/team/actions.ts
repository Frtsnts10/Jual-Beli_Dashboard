"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { addStoreAdmin } from "@/lib/access/team";
import { TIERS } from "@/config/tiers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Multi-user admin (Ultimate). An existing account gets access immediately; otherwise an
 * invitation waits in store_invites and is accepted when that email first signs in.
 * Admins manage products, vault, orders, marketing and storefront settings — but not
 * billing, the store QRIS, domains or the team (owner only).
 */
export async function inviteAdmin(storeId: string, rawEmail: string): Promise<ActionResult<{ pending: boolean }>> {
  const { user, store, tier } = await requireStore(storeId, { ownerOnly: true });
  if (!TIERS[tier].multiAdmin) return fail("Multi-user admin adalah fitur paket Ultimate.");
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return fail("Email tidak valid.");
  if (email === user.email.toLowerCase()) return fail("Itu email Anda sendiri.");

  // Only a verified account is added straight away: otherwise anyone could pre-register the
  // invitee's address and inherit the access.
  const existing = await adminAuth.getUserByEmail(email).catch(() => null);
  if (existing?.emailVerified) {
    if (existing.uid === store.owner_uid) return fail("Itu pemilik toko.");
    const member = await adminDb.collection("stores").doc(storeId).collection("members").doc(existing.uid).get();
    if (member.exists) return fail("Orang ini sudah menjadi admin.");
    await addStoreAdmin(storeId, existing.uid, email, user.uid);
    revalidatePath(`/${storeId}/settings`);
    return { ok: true, data: { pending: false } };
  }

  const dup = await adminDb.collection("store_invites").where("store_id", "==", storeId).where("email", "==", email).limit(1).get();
  if (!dup.empty) return fail("Undangan untuk email ini sudah ada.");
  await adminDb.collection("store_invites").add({ store_id: storeId, email, invited_by: user.uid, created_at: FieldValue.serverTimestamp() });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true, data: { pending: true } };
}

export async function removeAdmin(storeId: string, uid: string): Promise<ActionResult> {
  await requireStore(storeId, { ownerOnly: true });
  const storeRef = adminDb.collection("stores").doc(storeId);
  const batch = adminDb.batch();
  batch.update(storeRef, { admin_uids: FieldValue.arrayRemove(uid) });
  batch.delete(storeRef.collection("members").doc(uid));
  await batch.commit();
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}

export async function cancelInvite(storeId: string, inviteId: string): Promise<ActionResult> {
  await requireStore(storeId, { ownerOnly: true });
  const ref = adminDb.collection("store_invites").doc(inviteId);
  const snap = await ref.get();
  if (!snap.exists || snap.get("store_id") !== storeId) return fail("Undangan tidak ditemukan.");
  await ref.delete();
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}
