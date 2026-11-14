"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/auth";
import { fail, type ActionResult } from "@/lib/action-result";
import { DISCORD_API, TELEGRAM_API } from "@/lib/bots";
import { TIERS } from "@/config/tiers";

const integrationsRef = (storeId: string) => adminDb.collection("stores").doc(storeId).collection("private").doc("integrations");

async function dashboardOrigin() {
  const h = await headers();
  return process.env.DASHBOARD_PUBLIC_URL ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
}

async function requireBots(storeId: string) {
  const access = await requireStore(storeId);
  if (!TIERS[access.tier].marketing) throw new Error("NOT_ULTIMATE");
  return access;
}

/** Validates a BotFather token and points the bot's webhook at this store's endpoint. */
export async function connectTelegram(storeId: string, rawToken: string): Promise<ActionResult<{ username: string }>> {
  try {
    await requireBots(storeId);
  } catch {
    return fail("Bot komunitas adalah fitur paket Ultimate.");
  }
  const token = rawToken.trim();
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) return fail("Format token BotFather tidak valid.");

  const me = await fetch(`${TELEGRAM_API}/bot${token}/getMe`).then((r) => r.json()).catch(() => null);
  if (!me?.ok) return fail("Token ditolak Telegram. Salin ulang dari @BotFather.");

  const secret = randomBytes(24).toString("hex");
  const hook = await fetch(`${TELEGRAM_API}/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: `${await dashboardOrigin()}/api/bots/telegram/${storeId}`, secret_token: secret, allowed_updates: ["message"] }),
  })
    .then((r) => r.json())
    .catch(() => null);
  if (!hook?.ok) return fail(`Gagal memasang webhook Telegram${hook?.description ? `: ${hook.description}` : "."}`);

  await integrationsRef(storeId).set(
    { telegram_bot_token: token, telegram_webhook_secret: secret, telegram_bot_username: me.result.username },
    { merge: true }
  );
  revalidatePath(`/${storeId}/settings`);
  return { ok: true, data: { username: me.result.username } };
}

export async function disconnectTelegram(storeId: string): Promise<ActionResult> {
  await requireStore(storeId);
  const snap = await integrationsRef(storeId).get();
  const token = snap.get("telegram_bot_token");
  if (token) await fetch(`${TELEGRAM_API}/bot${token}/deleteWebhook`, { method: "POST" }).catch(() => {});
  await integrationsRef(storeId).update({
    telegram_bot_token: FieldValue.delete(),
    telegram_webhook_secret: FieldValue.delete(),
    telegram_bot_username: FieldValue.delete(),
  });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}

/**
 * Registers /katalog and /lacak on the seller's Discord application. The bot token is used
 * once for that and never stored; only the application id and public key (needed to verify
 * interactions) are kept.
 */
export async function connectDiscord(
  storeId: string,
  input: { applicationId: string; publicKey: string; botToken: string }
): Promise<ActionResult> {
  try {
    await requireBots(storeId);
  } catch {
    return fail("Bot komunitas adalah fitur paket Ultimate.");
  }
  const applicationId = input.applicationId.trim();
  const publicKey = input.publicKey.trim().toLowerCase();
  if (!/^\d{15,22}$/.test(applicationId)) return fail("Application ID tidak valid.");
  if (!/^[0-9a-f]{64}$/.test(publicKey)) return fail("Public key harus 64 karakter hex.");

  const res = await fetch(`${DISCORD_API}/applications/${applicationId}/commands`, {
    method: "PUT",
    headers: { Authorization: `Bot ${input.botToken.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      { name: "katalog", description: "Lihat produk & link checkout", type: 1 },
      { name: "lacak", description: "Link lacak pesanan & klaim garansi", type: 1 },
    ]),
  }).catch(() => null);
  if (!res?.ok) return fail("Discord menolak pendaftaran perintah. Cek Application ID & Bot Token.");

  await integrationsRef(storeId).set({ discord_application_id: applicationId, discord_public_key: publicKey }, { merge: true });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}

export async function disconnectDiscord(storeId: string): Promise<ActionResult> {
  await requireStore(storeId);
  await integrationsRef(storeId).update({ discord_application_id: FieldValue.delete(), discord_public_key: FieldValue.delete() });
  revalidatePath(`/${storeId}/settings`);
  return { ok: true };
}
