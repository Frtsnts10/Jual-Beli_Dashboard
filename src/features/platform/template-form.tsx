"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FONTS, RADIUS, type FontKey, type RadiusKey, type TemplateInfo } from "@/lib/catalog-core";
import { saveTemplate } from "./catalog-actions";

const RADIUS_LABEL: Record<RadiusKey, string> = { none: "Kotak (0)", sm: "Kecil (sm)", md: "Sedang (md)", lg: "Besar (lg)", xl: "Sangat besar (xl)" };

/** Admin → Tema: one storefront template. */
export function TemplateForm({ template, plansUsing, storesUsing }: { template: TemplateInfo; plansUsing: string[]; storesUsing: number }) {
  const [enabled, setEnabled] = useState(template.enabled);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [radius, setRadius] = useState<RadiusKey | "default">(template.style.radius ?? "default");
  const [font, setFont] = useState<FontKey | "default">(template.style.font ?? "default");
  const [accent, setAccent] = useState<string | null>(template.style.accent);
  const [pending, start] = useTransition();

  return (
    <Card className={enabled ? "" : "opacity-75"}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {name} {!enabled && <Badge variant="secondary">Nonaktif</Badge>}
          </span>
          <label className="flex items-center gap-2 text-sm font-normal">
            Aktif <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={`${name} aktif`} />
          </label>
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          {plansUsing.length ? `Di paket: ${plansUsing.join(", ")}` : "Belum ada paket yang memakai"} · dipakai {storesUsing} toko
          {!enabled && storesUsing > 0 && " — toko ini tampil dengan template lain yang tersedia di paketnya"}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${template.id}-name`}>Nama (dilihat seller)</Label>
          <Input id={`${template.id}-name`} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${template.id}-desc`}>Deskripsi</Label>
          <Textarea id={`${template.id}-desc`} rows={2} maxLength={160} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Sudut</Label>
            <Select value={radius} onValueChange={(v) => setRadius(v as RadiusKey | "default")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Bawaan tema</SelectItem>
                {(Object.keys(RADIUS) as RadiusKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {RADIUS_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Font</Label>
            <Select value={font} onValueChange={(v) => setFont(v as FontKey | "default")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Bawaan tema</SelectItem>
                {(Object.keys(FONTS) as FontKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {FONTS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${template.id}-accent`}>Warna aksen default</Label>
            <div className="flex items-center gap-2">
              <input
                id={`${template.id}-accent`}
                type="color"
                value={accent ?? "#7c3aed"}
                onChange={(e) => setAccent(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border"
              />
              {accent ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAccent(null)}>
                  Reset
                </Button>
              ) : (
                <span className="text-muted-foreground text-xs">Bawaan</span>
              )}
            </div>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">Warna aksen default dipakai toko yang belum memilih warnanya sendiri. Sudut & font berlaku untuk semua toko dengan template ini.</p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveTemplate(template.id, {
                enabled,
                name,
                description,
                radius: radius === "default" ? null : radius,
                font: font === "default" ? null : font,
                accent,
              });
              if (!res.ok) return void toast.error(res.error);
              toast.success(`Template ${name} disimpan`);
            })
          }
        >
          Simpan template
        </Button>
      </CardFooter>
    </Card>
  );
}
