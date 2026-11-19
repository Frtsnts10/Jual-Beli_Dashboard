"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireUser } from "@/lib/access/auth";
import { isPlatformAdmin, requirePlatformAdmin, isAdminEmail } from "@/lib/access/platform";
import { fail, type ActionResult } from "@/lib/action-result";
import { randomId } from "@/lib/ids";
import { saveImageAt } from "@/lib/media";
import { notify, platformAdminUids } from "@/lib/notify";
import {
  TICKET_CATEGORIES,
  TICKET_STATUS,
  type TicketCategory,
  type TicketStatus,
} from "@/lib/support";

const MAX_OPEN = 10;

async function attach(
  uid: string,
  image?: string | null,
): Promise<string | null> {
  if (!image) return null;
  try {
    return await saveImageAt(`support/${uid}`, image);
  } catch {
    return null; // a missing screenshot shouldn't lose the report
  }
}

/** Seller: report a bug / ask for help. Admins get a bell + push notification. */
export async function createTicket(input: {
  storeId: string | null;
  category: TicketCategory;
  subject: string;
  message: string;
  image?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const subject = input.subject.trim().slice(0, 120);
  const message = input.message.trim().slice(0, 4000);
  if (!TICKET_CATEGORIES.some((c) => c.key === input.category))
    return fail("Pilih kategori.");
  if (subject.length < 3) return fail("Judul minimal 3 karakter.");
  if (message.length < 10)
    return fail("Ceritakan masalahnya (minimal 10 karakter).");
  const open = await adminDb
    .collection("support_tickets")
    .where("uid", "==", user.uid)
    .where("status", "in", ["NEW", "IN_PROGRESS"])
    .count()
    .get();
  if (open.data().count >= MAX_OPEN)
    return fail(
      `Masih ada ${MAX_OPEN} laporan terbuka. Tunggu sebagian selesai dulu.`,
    );

  const id = randomId("T");
  const image = await attach(user.uid, input.image);
  const ref = adminDb.collection("support_tickets").doc(id);
  const batch = adminDb.batch();
  batch.create(ref, {
    uid: user.uid,
    email: user.email,
    name: user.full_name,
    store_id: input.storeId,
    category: input.category,
    subject,
    status: "NEW",
    unread_by_admin: true,
    unread_by_user: false,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });
  batch.create(ref.collection("messages").doc(), {
    from: "user",
    author: user.email,
    text: message,
    image,
    created_at: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  await notify(await platformAdminUids(), {
    type: "admin_ticket",
    title: `Laporan baru: ${subject}`,
    body: `${user.email} · ${message.slice(0, 120)}`,
    href: `/platform/support/${id}`,
  });
  revalidatePath("/", "layout");
  return { ok: true, data: { id } };
}

/** A reply in the thread, from the ticket's owner or a platform admin. */
export async function replyTicket(
  ticketId: string,
  text: string,
  image?: string | null,
): Promise<ActionResult> {
  const user = await requireUser();
  const admin = await isPlatformAdmin();
  const ref = adminDb.collection("support_tickets").doc(ticketId);
  const t = await ref.get();
  if (!t.exists || (!admin && t.get("uid") !== user.uid))
    return fail("Laporan tidak ditemukan.");
  const body = text.trim().slice(0, 4000);
  if (!body && !image) return fail("Tulis balasan.");
  // An admin replying to their own report still answers as the user.
  const fromAdmin = admin && t.get("uid") !== user.uid;
  const status: TicketStatus = fromAdmin
    ? t.get("status") === "NEW"
      ? "IN_PROGRESS"
      : t.get("status")
    : t.get("status") === "RESOLVED"
      ? "IN_PROGRESS"
      : t.get("status");
  const batch = adminDb.batch();
  batch.create(ref.collection("messages").doc(), {
    from: fromAdmin ? "admin" : "user",
    author: fromAdmin ? "Admin" : user.email,
    text: body,
    image: await attach(user.uid, image),
    created_at: FieldValue.serverTimestamp(),
  });
  batch.update(ref, {
    status,
    updated_at: FieldValue.serverTimestamp(),
    unread_by_admin: !fromAdmin,
    unread_by_user: fromAdmin,
  });
  await batch.commit();
  if (fromAdmin) {
    const storeId = t.get("store_id") as string | null;
    await notify([t.get("uid")], {
      type: "ticket_reply",
      title: `Balasan admin: ${t.get("subject")}`,
      body: body.slice(0, 140),
      href: storeId ? `/${storeId}/support/${ticketId}` : "/dashboard",
    });
  } else {
    await notify(await platformAdminUids(), {
      type: "admin_ticket",
      title: `Balasan di laporan: ${t.get("subject")}`,
      body: `${user.email}: ${body.slice(0, 120)}`,
      href: `/platform/support/${ticketId}`,
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Admin moves a ticket between Baru / Diproses / Selesai; the owner can mark theirs Selesai. */
export async function setTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<ActionResult> {
  const user = await requireUser();
  const admin = await isPlatformAdmin();
  if (!(status in TICKET_STATUS)) return fail("Status tidak dikenal.");
  const ref = adminDb.collection("support_tickets").doc(ticketId);
  const t = await ref.get();
  if (
    !t.exists ||
    (!admin && (t.get("uid") !== user.uid || status !== "RESOLVED"))
  )
    return fail("Laporan tidak ditemukan.");
  await ref.update({ status, updated_at: FieldValue.serverTimestamp() });
  if (admin && t.get("uid") !== user.uid && status === "RESOLVED") {
    const storeId = t.get("store_id") as string | null;
    await notify([t.get("uid")], {
      type: "ticket_resolved",
      title: `Laporan selesai: ${t.get("subject")}`,
      body: "Admin menandai laporan Anda selesai. Balas jika masalahnya masih ada.",
      href: storeId ? `/${storeId}/support/${ticketId}` : "/dashboard",
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Opening a thread clears its unread flag for whoever reads it. */
export async function markTicketSeen(
  ticketId: string,
  as: "admin" | "user",
): Promise<void> {
  if (as === "admin") await requirePlatformAdmin();
  else await requireUser();
  await adminDb
    .collection("support_tickets")
    .doc(ticketId)
    .update({ [as === "admin" ? "unread_by_admin" : "unread_by_user"]: false })
    .catch(() => {});
}

// ---------- Announcements ----------

/** Admin: a banner on every matching dashboard + a notification (bell + push) to each user. */
export async function createAnnouncement(input: {
  title: string;
  body: string;
  level: "info" | "warning" | "maintenance";
  tiers: string[] | null;
  endsAt: string | null;
}): Promise<ActionResult<{ notified: number }>> {
  const admin = await requirePlatformAdmin();
  const title = input.title.trim().slice(0, 100);
  const body = input.body.trim().slice(0, 1000);
  if (title.length < 3) return fail("Judul minimal 3 karakter.");
  if (!["info", "warning", "maintenance"].includes(input.level))
    return fail("Jenis tidak dikenal.");
  const tiers =
    input.tiers?.filter((t) => ["starter", "pro", "ultimate"].includes(t)) ??
    null;
  if (tiers && tiers.length === 0)
    return fail("Pilih minimal satu paket, atau Semua pengguna.");
  const endsAt = input.endsAt ? new Date(input.endsAt) : null;
  if (
    endsAt &&
    (Number.isNaN(endsAt.getTime()) || endsAt.getTime() < Date.now())
  )
    return fail("Tanggal berakhir harus di masa depan.");

  const id = randomId("A");
  await adminDb.collection("announcements").doc(id).create({
    title,
    body,
    level: input.level,
    tiers,
    ends_at: endsAt,
    active: true,
    created_by: admin.email,
    created_at: FieldValue.serverTimestamp(),
  });
  const users = await adminDb
    .collection("users")
    .select("subscription_tier", "email")
    .get();
  // Announcements are for sellers; admin accounts aren't sellers.
  const uids = users.docs
    .filter((u) => !isAdminEmail((u.get("email") as string) ?? ""))
    .filter(
      (u) =>
        !tiers ||
        tiers.includes((u.get("subscription_tier") as string) ?? "starter"),
    )
    .map((u) => u.id);
  await notify(uids, {
    type: "announcement",
    title,
    body: body.slice(0, 160),
    href: "/dashboard",
  });
  revalidatePath("/", "layout");
  return { ok: true, data: { notified: uids.length } };
}

export async function endAnnouncement(id: string): Promise<ActionResult> {
  await requirePlatformAdmin();
  await adminDb.collection("announcements").doc(id).update({ active: false });
  revalidatePath("/", "layout");
  return { ok: true };
}
