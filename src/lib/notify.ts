import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb, adminMessaging } from "@/lib/firebase/admin";

// In-app notifications (the bell in the dashboard header) plus browser/phone push through
// Firebase Cloud Messaging. Every notification is a doc in notifications/{id} for one user;
// push is best effort on top (only for users who allowed it on a device).

export interface NotifyInput {
  type: string;
  title: string;
  body: string;
  /** Dashboard path to open, e.g. /platform/support/T123. */
  href: string;
}

/** uids of the platform admins (PLATFORM_ADMIN_EMAILS), looked up by email. */
export async function platformAdminUids(): Promise<string[]> {
  const emails = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 30);
  if (emails.length === 0) return [];
  const snap = await adminDb
    .collection("users")
    .where("email", "in", emails)
    .get();
  return snap.docs.map((d) => d.id);
}

export async function notify(uids: string[], n: NotifyInput): Promise<void> {
  const targets = [...new Set(uids.filter(Boolean))];
  if (targets.length === 0) return;
  for (let i = 0; i < targets.length; i += 400) {
    const batch = adminDb.batch();
    for (const uid of targets.slice(i, i + 400)) {
      batch.create(adminDb.collection("notifications").doc(), {
        uid,
        ...n,
        read: false,
        created_at: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
  await push(targets, n).catch((err) => console.error("push failed", err));
}

/** Sends to every registered device of these users; forgets tokens FCM says are dead. */
async function push(uids: string[], n: NotifyInput) {
  // No FCM in local emulator runs.
  if (process.env.FIRESTORE_EMULATOR_HOST) return;
  const tokens: string[] = [];
  for (let i = 0; i < uids.length; i += 30) {
    const snap = await adminDb
      .collection("push_tokens")
      .where("uid", "in", uids.slice(i, i + 30))
      .get();
    tokens.push(...snap.docs.map((d) => d.id));
  }
  if (tokens.length === 0) return;
  const base = process.env.DASHBOARD_PUBLIC_URL ?? "";
  for (let i = 0; i < tokens.length; i += 500) {
    const chunk = tokens.slice(i, i + 500);
    const res = await adminMessaging.sendEachForMulticast({
      tokens: chunk,
      notification: { title: n.title, body: n.body },
      // fcmOptions.link must be absolute https; without DASHBOARD_PUBLIC_URL the service worker opens data.href.
      webpush: {
        ...(base.startsWith("https://")
          ? { fcmOptions: { link: `${base}${n.href}` } }
          : {}),
        notification: { icon: "/icon.png" },
      },
      data: { href: n.href },
    });
    const dead = res.responses
      .map((r, j) =>
        !r.success &&
        /registration-token-not-registered|invalid-registration-token/.test(
          r.error?.code ?? "",
        )
          ? chunk[j]
          : null,
      )
      .filter((t): t is string => !!t);
    await Promise.all(
      dead.map((t) => adminDb.collection("push_tokens").doc(t).delete()),
    );
  }
}
