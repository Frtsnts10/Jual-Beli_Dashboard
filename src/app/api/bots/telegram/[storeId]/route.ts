import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { botCatalog, botSecrets, catalogText, TELEGRAM_API } from "@/lib/integrations/bots";

// Telegram webhook for one store's bot. Registered by "Hubungkan Telegram" with a random
// secret_token, which Telegram echoes in X-Telegram-Bot-Api-Secret-Token.

interface Update {
  message?: { chat: { id: number }; text?: string };
}

function sameSecret(a: string | null, b: string | null) {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const secrets = await botSecrets(storeId);
  if (!sameSecret(req.headers.get("x-telegram-bot-api-secret-token"), secrets.telegramSecret) || !secrets.telegramToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const update = (await req.json()) as Update;
  const text = update.message?.text?.trim() ?? "";
  const chatId = update.message?.chat.id;
  // Commands may arrive as /katalog@NamaBot in groups.
  const command = text.split(/\s+/)[0]?.split("@")[0]?.toLowerCase();
  if (!chatId || !["/start", "/katalog", "/produk", "/lacak"].includes(command)) return NextResponse.json({ ok: true });

  const catalog = await botCatalog(storeId, "telegram");
  const body = !catalog
    ? { chat_id: chatId, text: "Toko ini sedang tidak menerima pesanan lewat bot." }
    : command === "/lacak"
      ? { chat_id: chatId, text: `Lacak pesanan & klaim garansi: ${catalog.trackUrl}` }
      : {
          chat_id: chatId,
          text: catalogText(catalog.store.store_name, catalog.items),
          reply_markup: {
            inline_keyboard: catalog.items.filter((i) => i.inStock).map((i) => [{ text: `Beli ${i.title}`, url: i.url }]),
          },
        };

  await fetch(`${TELEGRAM_API}/bot${secrets.telegramToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error("Telegram sendMessage failed:", err));
  return NextResponse.json({ ok: true });
}
