"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AiThemeSettings } from "@/lib/catalog-core";
import { saveAiSettings } from "./catalog-actions";

/** Admin → Tema: turn "Buat tema dengan AI" on/off for the whole platform and set the monthly quota. */
export function AiSettingsCard({
  initial,
  configured,
  plansWithAi,
  usedThisMonth,
}: {
  initial: AiThemeSettings;
  configured: boolean;
  plansWithAi: string[];
  usedThisMonth: number;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [limit, setLimit] = useState(String(initial.monthlyLimit));
  const [pending, start] = useTransition();
  const save = (next: { enabled: boolean; monthlyLimit: number }) =>
    start(async () => {
      const res = await saveAiSettings(next);
      if (!res.ok) return void toast.error(res.error);
      toast.success(next.enabled ? "Tema AI aktif" : "Tema AI dimatikan");
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Sparkles className="size-4" /> Tema AI {enabled && configured ? <Badge variant="success">Aktif</Badge> : <Badge variant="secondary">Mati</Badge>}
          </span>
          <label className="flex items-center gap-2 text-sm font-normal">
            Nyalakan
            <Switch
              checked={enabled}
              disabled={pending}
              onCheckedChange={(v) => {
                setEnabled(v);
                save({ enabled: v, monthlyLimit: Number(limit) || initial.monthlyLimit });
              }}
              aria-label="Tema AI aktif"
            />
          </label>
        </CardTitle>
        <CardDescription>
          Seller menulis gaya yang diinginkan; AI (Claude) memilih template, warna, sudut dan font, lalu menulis tagline dan teks “Tentang toko”. Seller
          melihat pratinjau dulu sebelum menerapkannya.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        {!configured && (
          <p className="text-destructive">Belum bisa dipakai: isi ANTHROPIC_API_KEY di env Vercel project dashboard, lalu redeploy.</p>
        )}
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="ai-limit">Jatah per seller / bulan</Label>
            <div className="flex gap-2">
              <Input id="ai-limit" type="number" min={1} max={100} className="w-24" value={limit} onChange={(e) => setLimit(e.target.value)} />
              <Button variant="outline" disabled={pending} onClick={() => save({ enabled, monthlyLimit: Number(limit) })}>
                Simpan
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-xs sm:pb-2">
            Dipakai {usedThisMonth} kali bulan ini oleh semua toko. Paket yang mendapat Tema AI: {plansWithAi.length ? plansWithAi.join(", ") : "belum ada"} —
            atur di{" "}
            <Link href="/platform/plans" className="text-foreground underline underline-offset-4">
              Paket
            </Link>{" "}
            (atau per seller lewat Pengguna → Fitur khusus).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
