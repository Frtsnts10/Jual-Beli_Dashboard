import "server-only";
import { createPublicKey, verify } from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { effectiveTier, mapProduct, mapStore } from "@/lib/firestore-mappers";
import { storefrontUrl } from "@/lib/store-url";
import { formatIDR } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { effectivePrice } from "@/types/schema";

// Community bots (Ultimate, plan §3 "Bot Komunitas"): Telegram and Discord groups can ask
// the store's bot for the catalogue and get one-tap checkout links. Checkout itself stays
// on the storefront (same 2-field form + Xendit), so bots never handle payment data.
// Links carry ?ref=telegram / ?ref=discord, so bot sales show up in the affiliate report.

export const TELEGRAM_API = process.env.TELEGRAM_API_BASE ?? "https://api.telegram.org";
export const DISCORD_API = process.env.DISCORD_API_BASE ?? "https://discord.com/api/v10";

export interface CatalogItem {
  title: string;
  price: string;
  inStock: boolean;
  url: string;
}

/** Published products of an Ultimate store, with checkout links; null if bots aren't allowed. */
export async function botCatalog(storeId: string, ref: "telegram" | "discord") {
  const storeSnap = await adminDb.collection("stores").doc(storeId).get();
  if (!storeSnap.exists) return null;
  const store = mapStore(storeSnap);
  const owner = await adminDb.collection("users").doc(store.owner_uid).get();
  const tier = effectiveTier(owner.get("subscription_tier"), owner.get("subscription_expiry"));
  if (!TIERS[tier].marketing || !store.is_active) return null;

  // All products, so bundle components that are unpublished still count for bundle stock.
  const snap = await adminDb.collection("products").where("store_id", "==", storeId).get();
  const all = snap.docs.map(mapProduct);
  const stockOf = new Map(all.map((p) => [p.id, p.stock_available]));
  const base = storefrontUrl(store);
  const items: CatalogItem[] = all
    .filter((p) => p.is_published)
    .map((p) => (p.bundle_items?.length ? { ...p, stock_available: Math.min(...p.bundle_items.map((id) => stockOf.get(id) ?? 0)) } : p))
    .sort((a, b) => a.price - b.price)
    .slice(0, 25)
    .map((p) => {
      const sale = effectivePrice(p);
      return {
        title: p.title,
        price: sale.original ? `${formatIDR(sale.price)} (dari ${formatIDR(sale.original)})` : formatIDR(sale.price),
        inStock: p.stock_available > 0,
        url: `${base}/checkout/${p.id}?ref=${ref}`,
      };
    });
  return { store, items, trackUrl: `${base}/track` };
}

export function catalogText(storeName: string, items: CatalogItem[]) {
  if (items.length === 0) return `${storeName} belum punya produk yang dijual.`;
  const lines = items.map((it, i) => `${i + 1}. ${it.title} — ${it.price}${it.inStock ? "" : " (habis)"}`);
  return `🛍 ${storeName}\n\n${lines.join("\n")}\n\nKetuk tombol produk untuk checkout (email + WhatsApp, bayar QRIS/e-wallet).`;
}

/** Verifies a Discord interaction (Ed25519 over timestamp + raw body). */
export function verifyDiscordSignature(publicKeyHex: string, signatureHex: string, timestamp: string, rawBody: string) {
  try {
    const key = createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(publicKeyHex, "hex")]),
      format: "der",
      type: "spki",
    });
    return verify(null, Buffer.from(timestamp + rawBody), key, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}

export async function botSecrets(storeId: string) {
  const snap = await adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get();
  return {
    telegramToken: (snap.get("telegram_bot_token") as string | undefined) ?? null,
    telegramSecret: (snap.get("telegram_webhook_secret") as string | undefined) ?? null,
    discordAppId: (snap.get("discord_application_id") as string | undefined) ?? null,
    discordPublicKey: (snap.get("discord_public_key") as string | undefined) ?? null,
  };
}
