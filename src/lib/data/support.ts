import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { toISO } from "@/lib/data/mappers";
import type { TicketStatus } from "@/lib/support";

export interface TicketRow {
  id: string;
  uid: string;
  email: string;
  name: string;
  store_id: string | null;
  category: string;
  subject: string;
  status: TicketStatus;
  unread_by_admin: boolean;
  unread_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  from: "user" | "admin";
  author: string;
  text: string;
  image: string | null;
  created_at: string;
}

const mapTicket = (d: FirebaseFirestore.DocumentSnapshot): TicketRow => ({
  id: d.id,
  uid: d.get("uid"),
  email: d.get("email") ?? "",
  name: d.get("name") ?? "",
  store_id: d.get("store_id") ?? null,
  category: d.get("category") ?? "other",
  subject: d.get("subject") ?? "",
  status: d.get("status") ?? "NEW",
  unread_by_admin: !!d.get("unread_by_admin"),
  unread_by_user: !!d.get("unread_by_user"),
  created_at: toISO(d.get("created_at")) ?? "",
  updated_at: toISO(d.get("updated_at")) ?? "",
});

export async function listUserTickets(uid: string) {
  const snap = await adminDb
    .collection("support_tickets")
    .where("uid", "==", uid)
    .orderBy("updated_at", "desc")
    .limit(200)
    .get();
  return snap.docs.map(mapTicket);
}

export async function listAllTickets(status?: TicketStatus) {
  const base = adminDb.collection("support_tickets");
  const snap = await (status ? base.where("status", "==", status) : base)
    .orderBy("updated_at", "desc")
    .limit(500)
    .get();
  return snap.docs.map(mapTicket);
}

export async function getTicket(id: string) {
  const ref = adminDb.collection("support_tickets").doc(id);
  const [t, msgs] = await Promise.all([
    ref.get(),
    ref.collection("messages").orderBy("created_at", "asc").get(),
  ]);
  if (!t.exists) return null;
  return {
    ticket: mapTicket(t),
    messages: msgs.docs.map(
      (m): TicketMessage => ({
        id: m.id,
        from: m.get("from") === "admin" ? "admin" : "user",
        author: m.get("author") ?? "",
        text: m.get("text") ?? "",
        image: m.get("image") ?? null,
        created_at: toISO(m.get("created_at")) ?? "",
      }),
    ),
  };
}

export async function countNewTickets() {
  return (
    await adminDb
      .collection("support_tickets")
      .where("unread_by_admin", "==", true)
      .count()
      .get()
  ).data().count;
}

/** Seller's "Bantuan" badge: their reports with an admin reply they haven't opened. */
export async function countUserUnreadTickets(uid: string) {
  return (
    await adminDb
      .collection("support_tickets")
      .where("uid", "==", uid)
      .where("unread_by_user", "==", true)
      .count()
      .get()
  ).data().count;
}

export async function listAnnouncements() {
  const snap = await adminDb
    .collection("announcements")
    .orderBy("created_at", "desc")
    .limit(50)
    .get();
  const now = Date.now();
  return snap.docs.map((d) => ({
    live:
      !!d.get("active") &&
      (!d.get("ends_at") || d.get("ends_at").toMillis() > now),
    id: d.id,
    title: (d.get("title") as string) ?? "",
    body: (d.get("body") as string) ?? "",
    level: (d.get("level") as string) ?? "info",
    tiers: (d.get("tiers") as string[] | null) ?? null,
    active: !!d.get("active"),
    ends_at: toISO(d.get("ends_at")),
    created_at: toISO(d.get("created_at")) ?? "",
  }));
}
