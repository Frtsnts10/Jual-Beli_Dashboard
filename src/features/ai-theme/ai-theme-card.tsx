"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FONTS, RADIUS } from "@/lib/catalog-core";
import type { AiThemeDesign } from "@/lib/ai/theme";
import { applyAiTheme, clearThemeOverride, generateAiTheme, type AiThemeStatus } from "./actions";

const FONT_CSS = { sans: "var(--font-geist-sans), system-ui, sans-serif", serif: "Georgia, 'Times New Roman', serif", mono: "ui-monospace, Menlo, monospace" };

/** Store settings → "Buat tema dengan AI": describe a look, preview what the AI designed, apply it. */
export function AiThemeCard({
  storeId,
  status,
  templateNames,
  hasOverride,
}: {
  storeId: string;
  status: AiThemeStatus;
  templateNames: Record<string, string>;
  hasOverride: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState("");
  const [design, setDesign] = useState<AiThemeDesign | null>(null);
  const [used, setUsed] = useState(status.used);
  const [pending, start] = useTransition();
  const left = Math.max(0, status.limit - used);

  const generate = () =>
    start(async () => {
      const res = await generateAiTheme(storeId, brief);
      if (!res.ok) return void toast.error(res.error);
      setDesign(res.data!.design);
      setUsed(res.data!.used);
    });

  const apply = () =>
    start(async () => {
      if (!design) return;
      const res = await applyAiTheme(storeId, design);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Tema AI diterapkan ke etalase.");
      setOpen(false);
      // The settings forms below hold their own copies of these fields: reload to show the new ones.
      window.location.reload();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" /> Tema AI
        </CardTitle>
        <CardDescription>
          Ceritakan gaya yang Anda mau; AI memilih template, warna, sudut dan font, lalu menulis tagline dan teks “Tentang toko”. Anda lihat dulu sebelum
          diterapkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        {status.blocked === "plan" ? (
          <p className="text-muted-foreground text-sm">
            Belum tersedia di paket Anda.{" "}
            <Link href={`/${storeId}/billing`} className="text-foreground underline underline-offset-4">
              Lihat paket
            </Link>
          </p>
        ) : (
          <>
            <Button onClick={() => setOpen(true)} disabled={left === 0}>
              <Wand2 /> Buat tema dengan AI
            </Button>
            <span className="text-muted-foreground text-sm">
              Sisa {left} dari {status.limit} kali bulan ini
            </span>
          </>
        )}
        {hasOverride && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await clearThemeOverride(storeId);
                if (!res.ok) return void toast.error(res.error);
                toast.success("Sudut & font kembali ke bawaan template.");
                window.location.reload();
              })
            }
          >
            <RotateCcw /> Sudut & font bawaan
          </Button>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Buat tema dengan AI</DialogTitle>
            <DialogDescription>Setiap “Buat desain” memakai 1 jatah. Sisa {left} kali bulan ini.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="ai-brief">Gaya yang diinginkan (opsional)</Label>
            <Textarea
              id="ai-brief"
              rows={3}
              maxLength={500}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Mis. elegan dan gelap untuk gamer, warna ungu, kesan premium tapi ramah."
            />
          </div>

          {design && (
            <div className="grid gap-3 rounded-lg border p-4 text-sm" style={{ fontFamily: FONT_CSS[design.font] }}>
              <div className="flex items-center gap-3">
                <span className="size-8 shrink-0 border" style={{ background: design.accent, borderRadius: RADIUS[design.radius] }} />
                <div className="min-w-0">
                  <div className="font-semibold">{templateNames[design.template] ?? design.template}</div>
                  <div className="text-muted-foreground text-xs">
                    {design.accent} · sudut {design.radius} · font {FONTS[design.font]}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Tagline</div>
                <p className="font-medium">{design.tagline}</p>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Tentang toko</div>
                <p>{design.about}</p>
              </div>
              <button
                type="button"
                className="w-fit px-4 py-2 text-xs font-medium text-white"
                style={{ background: design.accent, borderRadius: RADIUS[design.radius] }}
              >
                Contoh tombol
              </button>
              <p className="text-muted-foreground text-xs italic">{design.summary}</p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant={design ? "outline" : "default"} disabled={pending || left === 0} onClick={generate}>
              {pending && !design ? <Loader2 className="animate-spin" /> : <Wand2 />} {design ? "Buat ulang" : "Buat desain"}
            </Button>
            {design && (
              <Button disabled={pending} onClick={apply}>
                {pending ? <Loader2 className="animate-spin" /> : <Sparkles />} Terapkan ke etalase
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
