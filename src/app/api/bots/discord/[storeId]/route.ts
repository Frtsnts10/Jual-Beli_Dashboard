import { NextRequest, NextResponse } from "next/server";
import { botCatalog, botSecrets, catalogText, verifyDiscordSignature } from "@/lib/bots";

// Discord "Interactions Endpoint URL" for one store's application. Discord signs every
// request with the application's Ed25519 key and refuses the URL unless PINGs verify.

const PING = 1;
const APPLICATION_COMMAND = 2;

export async function POST(req: NextRequest, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const raw = await req.text();
  const { discordPublicKey } = await botSecrets(storeId);
  const ok =
    !!discordPublicKey &&
    verifyDiscordSignature(discordPublicKey, req.headers.get("x-signature-ed25519") ?? "", req.headers.get("x-signature-timestamp") ?? "", raw);
  if (!ok) return NextResponse.json({ error: "invalid request signature" }, { status: 401 });

  const interaction = JSON.parse(raw) as { type: number; data?: { name?: string } };
  if (interaction.type === PING) return NextResponse.json({ type: 1 });
  if (interaction.type !== APPLICATION_COMMAND) return NextResponse.json({ type: 4, data: { content: "Perintah tidak dikenal." } });

  const catalog = await botCatalog(storeId, "discord");
  if (!catalog) return NextResponse.json({ type: 4, data: { content: "Toko ini sedang tidak menerima pesanan lewat bot.", flags: 64 } });
  if (interaction.data?.name === "lacak") {
    return NextResponse.json({ type: 4, data: { content: `Lacak pesanan & klaim garansi: ${catalog.trackUrl}`, flags: 64 } });
  }

  // Up to 5 rows × 5 link buttons.
  const buttons = catalog.items.filter((i) => i.inStock).slice(0, 25).map((i) => ({ type: 2, style: 5, label: `Beli ${i.title}`.slice(0, 80), url: i.url }));
  const rows = Array.from({ length: Math.ceil(buttons.length / 5) }, (_, r) => ({ type: 1, components: buttons.slice(r * 5, r * 5 + 5) }));
  return NextResponse.json({ type: 4, data: { content: catalogText(catalog.store.store_name, catalog.items).slice(0, 2000), components: rows } });
}
