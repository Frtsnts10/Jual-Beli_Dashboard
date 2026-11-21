"use server";

import { demoBlocked } from "@/lib/access/demo";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/access/auth";
import { fail, type ActionResult } from "@/lib/action-result";

/** Marks the given notifications (or all unread ones) of the signed-in user as read. */
export async function markNotificationsRead(
  ids?: string[],
): Promise<ActionResult> {
  const user = await requireUser();
  const refs = ids?.length
    ? (
        await adminDb.getAll(
          ...ids
            .slice(0, 50)
            .map((id) => adminDb.collection("notifications").doc(id)),
        )
      ).filter((d) => d.exists && d.get("uid") === user.uid)
    : (
        await adminDb
          .collection("notifications")
          .where("uid", "==", user.uid)
          .where("read", "==", false)
          .limit(400)
          .get()
      ).docs;
  if (refs.length) {
    const batch = adminDb.batch();
    refs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Path part of a notification link, without query, hash or trailing slash. */
const pathOf = (href: string) => href.split(/[?#]/)[0].replace(/(.)\/+$/, "$1");

/**
 * Marks the signed-in user's unread notifications that point at `path` as read — opening the page a
 * notification is about counts as reading it. Returns how many changed.
 */
export async function markReadForPath(path: string): Promise<number> {
  const user = await requireUser();
  const here = pathOf(path);
  const snap = await adminDb
    .collection("notifications")
    .where("uid", "==", user.uid)
    .where("read", "==", false)
    .limit(200)
    .get();
  const hits = snap.docs.filter((d) => pathOf((d.get("href") as string | undefined) ?? "") === here);
  if (!hits.length) return 0;
  const batch = adminDb.batch();
  hits.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
  return hits.length;
}

/** A device that allowed push notifications (FCM registration token). */
export async function registerPushToken(token: string): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  const user = await requireUser();
  if (!/^[\w:-]{20,4096}$/.test(token)) return fail("Token tidak valid.");
  await adminDb
    .collection("push_tokens")
    .doc(token)
    .set({ uid: user.uid, updated_at: FieldValue.serverTimestamp() });
  return { ok: true };
}

export async function unregisterPushToken(
  token: string,
): Promise<ActionResult> {
  const demo = await demoBlocked();
  if (demo) return demo;
  const user = await requireUser();
  const ref = adminDb.collection("push_tokens").doc(token);
  const snap = await ref.get();
  if (snap.exists && snap.get("uid") === user.uid) await ref.delete();
  return { ok: true };
}
