"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Copy, ExternalLink, Globe, Lock, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { CustomDomainStatus } from "@/types/schema";
import type { DnsRecord } from "@/lib/integrations/vercel-domains";
import { checkDomain, connectDomain, disconnectDomain } from "./actions";

function Step({ done, title, children }: { done: boolean; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <Circle className="text-muted-foreground mt-0.5 size-5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function DomainCard({
  storeId,
  defaultUrl,
  allowed,
  domain,
  status,
  records,
  automated,
}: {
  storeId: string;
  defaultUrl: string;
  allowed: boolean;
  domain: string | null;
  status: CustomDomainStatus | null;
  records: DnsRecord[];
  automated: boolean;
}) {
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok?: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) toast.error(res.error);
      else if (ok) toast.success(ok);
    });

  const checks = status?.checks ?? { attached: automated, dns: false, live: false };
  const active = status?.state === "active";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-4" /> Alamat toko
          {domain && <Badge variant={active ? "success" : "warning"}>{active ? "Domain aktif" : "Menunggu setup"}</Badge>}
        </CardTitle>
        <CardDescription>
          Alamat bawaan:{" "}
          <a href={defaultUrl} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-4">
            {defaultUrl.replace(/^https?:\/\//, "")}
          </a>
          . Paket Ultimate bisa memakai domain sendiri (mis. tokoku.com).
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-5 text-sm">
        {!domain && !allowed && (
          <p className="text-muted-foreground flex items-center gap-2">
            <Lock className="size-4" /> Domain sendiri tersedia di paket Ultimate.
          </p>
        )}

        {!domain && allowed && (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => connectDomain(storeId, input), "Domain ditambahkan. Lanjutkan pengaturan DNS.");
            }}
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="tokoku.com" className="max-w-xs" required />
            <Button type="submit" disabled={pending}>
              Hubungkan domain
            </Button>
          </form>
        )}

        {domain && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-base font-semibold break-all">
              {domain}
              {active && (
                <a href={`https://${domain}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>

            <Step done={checks.attached} title="1. Domain terdaftar di platform">
              {!automated && (
                <p className="text-muted-foreground">Admin platform menambahkan domain ini ke project etalase (otomatis jika integrasi Vercel diaktifkan).</p>
              )}
            </Step>

            <Step done={checks.dns} title="2. Atur DNS di tempat Anda membeli domain">
              <p className="text-muted-foreground mb-2">
                Buka pengaturan DNS (Niagahoster, Rumahweb, Cloudflare, dll.), tambahkan record berikut, lalu tunggu 5 menit–24 jam. Di Cloudflare, set proxy
                ke <em>DNS only</em> (awan abu-abu).
              </p>
              <div className="grid gap-2">
                {records.map((r) => (
                  <div key={`${r.type}-${r.name}-${r.value}`} className="flex items-center gap-3 rounded-md border px-3 py-2">
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-mono font-semibold">{r.type}</span>
                        <span className="text-muted-foreground">Nama/Host</span>
                        <span className="font-mono">{r.name}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-muted-foreground">Nilai</span>
                        <span className="min-w-0 font-mono [overflow-wrap:anywhere]">{r.value}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      aria-label={`Salin nilai ${r.type}`}
                      onClick={async () => {
                        await navigator.clipboard.writeText(r.value);
                        toast.success("Disalin");
                      }}
                    >
                      <Copy />
                    </Button>
                  </div>
                ))}
              </div>
            </Step>

            <Step done={checks.live} title={`3. Toko terbuka di https://${domain} dengan SSL`}>
              <p className="text-muted-foreground">Kami membuka domain Anda dan memastikan yang tampil adalah toko ini.</p>
            </Step>

            {status?.message && !active && <p className="rounded-md bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400">{status.message}</p>}
            {status?.checked_at && <p className="text-muted-foreground text-xs">Terakhir dicek: {formatDate(status.checked_at, true)}</p>}
          </>
        )}
      </CardContent>

      {domain && (
        <CardFooter className="flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={pending}
            onClick={() => confirm(`Lepas domain ${domain} dari toko ini?`) && run(() => disconnectDomain(storeId), "Domain dilepas")}
          >
            <Trash2 /> Hapus domain
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await checkDomain(storeId);
                if (!res.ok) return void toast.error(res.error);
                if (res.data?.active) toast.success(`${domain} aktif! Toko Anda sudah bisa dibuka di domain ini.`);
                else toast.warning("Belum semua langkah selesai. Lihat langkah yang belum tercentang.");
              })
            }
          >
            <RefreshCw className={pending ? "animate-spin" : ""} /> Cek sekarang
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
