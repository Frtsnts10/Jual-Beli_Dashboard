import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { toISO } from "@/lib/data/mappers";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  created_at: string;
}

/** The bell's content: newest 20 and how many are unread. */
export async function listNotifications(
  uid: string,
): Promise<{ items: NotificationItem[]; unread: number }> {
  const [snap, unread] = await Promise.all([
    adminDb
      .collection("notifications")
      .where("uid", "==", uid)
      .orderBy("created_at", "desc")
      .limit(20)
      .get(),
    adminDb
      .collection("notifications")
      .where("uid", "==", uid)
      .where("read", "==", false)
      .count()
      .get(),
  ]);
  return {
    items: snap.docs.map((d) => ({
      id: d.id,
      type: d.get("type") ?? "",
      title: d.get("title") ?? "",
      body: d.get("body") ?? "",
      href: d.get("href") ?? "/dashboard",
      read: !!d.get("read"),
      created_at: toISO(d.get("created_at")) ?? "",
    })),
    unread: unread.data().count,
  };
}

/** Announcements currently shown as a banner to this user's plan. */
export async function activeAnnouncements(tier: string) {
  const snap = await adminDb
    .collection("announcements")
    .where("active", "==", true)
    .get();
  const now = Date.now();
  return snap.docs
    .map((d) => ({
      id: d.id,
      title: (d.get("title") as string) ?? "",
      body: (d.get("body") as string) ?? "",
      level: ((d.get("level") as string) ?? "info") as
        | "info"
        | "warning"
        | "maintenance",
      tiers: (d.get("tiers") as string[] | null) ?? null,
      ends_at: toISO(d.get("ends_at")),
      created_at: toISO(d.get("created_at")) ?? "",
    }))
    .filter(
      (a) =>
        (!a.tiers || a.tiers.includes(tier)) &&
        (!a.ends_at || new Date(a.ends_at).getTime() > now),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
