"use client";

import { useState, useTransition } from "react";
import { Copy, Lock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { connectDiscord, connectTelegram, disconnectDiscord, disconnectTelegram } from "./actions";

export function BotsCard({
  storeId,
  allowed,
  telegramUsername,
  discordConnected,
  discordEndpoint,
}: {
  storeId: string;
  allowed: boolean;
  telegramUsername: string | null;
  discordConnected: boolean;
  discordEndpoint: string;
}) {
  const [tgToken, setTgToken] = useState("");
  const [dc, setDc] = useState({ applicationId: "", publicKey: "", botToken: "" });
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(ok);
      after?.();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Bot komunitas {!allowed && <Lock className="size-4" />}</CardTitle>
        <CardDescription>
          Pembeli di grup Telegram/Discord ketik <code>/katalog</code> → bot membalas daftar produk dengan tombol checkout. Penjualan dari bot tercatat
          sebagai referral <code>telegram</code>/<code>discord</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 text-sm [&>*]:min-w-0">
        {!allowed ? (
          <p className="text-muted-foreground">Belum tersedia di paket Anda. Upgrade di menu Langganan.</p>
        ) : (
          <>
            <div className="grid gap-2 [&>*]:min-w-0">
              <div className="flex items-center gap-2 font-medium">
                Telegram {telegramUsername && <Badge variant="success">@{telegramUsername}</Badge>}
              </div>
              {telegramUsername ? (
                <Button variant="outline" className="w-fit" disabled={pending} onClick={() => run(() => disconnectTelegram(storeId), "Bot Telegram dilepas")}>
                  Lepas bot
                </Button>
              ) : (
                <>
                  <p className="text-muted-foreground">Buat bot di @BotFather (/newbot), lalu tempel tokennya. Tambahkan bot ke grup Anda.</p>
                  <div className="flex gap-2">
                    <Input type="password" autoComplete="off" value={tgToken} onChange={(e) => setTgToken(e.target.value)} placeholder="123456:ABC-…" />
                    <Button disabled={pending || !tgToken} onClick={() => run(() => connectTelegram(storeId, tgToken), "Bot Telegram terhubung", () => setTgToken(""))}>
                      Hubungkan
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-2 border-t pt-4 [&>*]:min-w-0">
              <div className="flex items-center gap-2 font-medium">Discord {discordConnected && <Badge variant="success">Terhubung</Badge>}</div>
              <p className="text-muted-foreground">
                Di Discord Developer Portal → aplikasi Anda → General Information, isi <em>Interactions Endpoint URL</em> dengan:
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-muted min-w-0 flex-1 truncate rounded-md px-2 py-1 text-xs">{discordEndpoint}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Salin URL"
                  onClick={async () => {
                    await navigator.clipboard.writeText(discordEndpoint);
                    toast.success("Disalin");
                  }}
                >
                  <Copy />
                </Button>
              </div>
              {discordConnected ? (
                <Button variant="outline" className="w-fit" disabled={pending} onClick={() => run(() => disconnectDiscord(storeId), "Discord dilepas")}>
                  Lepas Discord
                </Button>
              ) : (
                <div className="grid gap-2 md:grid-cols-3 [&>*]:min-w-0">
                  <div className="grid gap-1">
                    <Label htmlFor="dc_app">Application ID</Label>
                    <Input id="dc_app" value={dc.applicationId} onChange={(e) => setDc({ ...dc, applicationId: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="dc_key">Public Key</Label>
                    <Input id="dc_key" value={dc.publicKey} onChange={(e) => setDc({ ...dc, publicKey: e.target.value })} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="dc_token">Bot Token (sekali pakai)</Label>
                    <Input id="dc_token" type="password" autoComplete="off" value={dc.botToken} onChange={(e) => setDc({ ...dc, botToken: e.target.value })} />
                  </div>
                  <Button
                    className="w-fit justify-self-end md:col-span-3"
                    disabled={pending || !dc.applicationId || !dc.publicKey || !dc.botToken}
                    onClick={() => run(() => connectDiscord(storeId, dc), "Perintah /katalog terdaftar di Discord", () => setDc({ applicationId: "", publicKey: "", botToken: "" }))}
                  >
                    Daftarkan perintah
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
