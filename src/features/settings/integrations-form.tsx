"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { WaProvider } from "@/types/schema";
import { updateIntegrations } from "@/features/stores/actions";

export function IntegrationsForm({
  storeId,
  provider,
  hasToken,
  phoneNumberId,
  server,
  template,
  autoFulfillment,
}: {
  storeId: string;
  provider: WaProvider | null;
  hasToken: boolean;
  phoneNumberId: string | null;
  server: string | null;
  template: string;
  autoFulfillment: boolean;
}) {
  const [waProvider, setWaProvider] = useState<WaProvider | "">(provider ?? "");
  const [token, setToken] = useState("");
  const [pnid, setPnid] = useState(phoneNumberId ?? "");
  const [host, setHost] = useState(server ?? "");
  const [message, setMessage] = useState(template);
  const [pending, start] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp</CardTitle>
        <CardDescription>
          {autoFulfillment
            ? "Token API dipakai n8n untuk mengirim akun otomatis ke WhatsApp pembeli setelah pembayaran, setelah ganti garansi, dan untuk pengingat H-3."
            : "Paket Starter: kirim akun manual lewat tombol “Kirim via WhatsApp” di halaman Pesanan. Template di bawah dipakai untuk pesan tersebut."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Provider</Label>
            <Select value={waProvider || "none"} onValueChange={(v) => setWaProvider(v === "none" ? "" : (v as WaProvider))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Belum diatur</SelectItem>
                <SelectItem value="fonnte">Fonnte</SelectItem>
                <SelectItem value="wablas">Wablas</SelectItem>
                <SelectItem value="meta">Meta (Official)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="token">API token</Label>
            <Input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder={hasToken ? "•••••• (tersimpan — isi untuk mengganti)" : ""} autoComplete="off" />
          </div>
          {waProvider === "meta" && (
            <div className="grid gap-2">
              <Label htmlFor="pnid">Phone Number ID</Label>
              <Input id="pnid" inputMode="numeric" value={pnid} onChange={(e) => setPnid(e.target.value.replace(/\D/g, ""))} placeholder="mis. 106540352242922" />
              <p className="text-muted-foreground text-xs">Meta for Developers → aplikasi Anda → WhatsApp → API Setup. Token: buat System User permanen di Business Settings.</p>
            </div>
          )}
          {waProvider === "wablas" && (
            <div className="grid gap-2">
              <Label htmlFor="wserver">Server Wablas</Label>
              <Input id="wserver" value={host} onChange={(e) => setHost(e.target.value)} placeholder="mis. tegal.wablas.com" />
              <p className="text-muted-foreground text-xs">Lihat di dashboard Wablas Anda (alamat server/domain API).</p>
            </div>
          )}
        </div>
        {waProvider === "meta" && (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            Meta hanya mengizinkan pesan bebas dalam 24 jam setelah pembeli mengirim pesan ke nomor Anda. Di luar itu pesan harus memakai template yang disetujui Meta — atur di workflow n8n Anda (lihat docs/n8n.md). Untuk pengiriman akun otomatis tanpa repot, Fonnte/Wablas lebih praktis.
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="template">Template pesan</Label>
          <Textarea id="template" rows={7} value={message} onChange={(e) => setMessage(e.target.value)} className="font-mono text-xs" />
          <p className="text-muted-foreground text-xs">Variabel: {"{product} {store} {email} {password} {pin} {expiry} {order_id}"}</p>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await updateIntegrations(storeId, { wa_api_provider: waProvider, wa_api_token: token, wa_phone_number_id: pnid, wa_server: host, wa_message_template: message });
              if (!res.ok) return void toast.error(res.error);
              setToken("");
              toast.success("Integrasi disimpan");
            })
          }
        >
          Simpan integrasi
        </Button>
      </CardFooter>
    </Card>
  );
}
