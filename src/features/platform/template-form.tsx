"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FONTS, RADIUS, type FontKey, type RadiusKey, type TemplateInfo } from "@/lib/catalog-core";
import { saveTemplate } from "./catalog-actions";

const RADIUS_LABEL: Record<RadiusKey, string> = { none: "Kotak (0)", sm: "Kecil (sm)", md: "Sedang (md)", lg: "Besar (lg)", xl: "Sangat besar (xl)" };

/** Admin → Tema: one storefront template as a compact row; details open in a dialog. */
export function TemplateForm({ template, plansUsing, storesUsing }: { template: TemplateInfo; plansUsing: string[]; storesUsing: number }) {
  // What is saved now (the row shows this); the dialog edits a draft.
  const [saved, setSaved] = useState(template);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);
  const [radius, setRadius] = useState<RadiusKey | "default">(template.style.radius ?? "default");
  const [font, setFont] = useState<FontKey | "default">(template.style.font ?? "default");
  const [accent, setAccent] = useState<string | null>(template.style.accent);
  const [pending, start] = useTransition();

  const save = (next: TemplateInfo, done?: () => void) =>
    start(async () => {
      const res = await saveTemplate(next.id, { enabled: next.enabled, name: next.name, description: next.description, ...next.style });
      if (!res.ok) return void toast.error(res.error);
      setSaved(next);
      toast.success(`Template ${next.name} disimpan`);
      done?.();
    });

  const openEditor = (o: boolean) => {
    if (o) {
      setName(saved.name);
      setDescription(saved.description);
      setRadius(saved.style.radius ?? "default");
      setFont(saved.style.font ?? "default");
      setAccent(saved.style.accent);
    }
    setOpen(o);
  };

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 ${saved.enabled ? "" : "opacity-60"}`}>
      <span
        className="size-8 shrink-0 border"
        style={{ background: saved.style.accent ?? "var(--muted)", borderRadius: saved.style.radius ? RADIUS[saved.style.radius] : "0.375rem" }}
        title={saved.style.accent ?? "Warna bawaan"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-medium">
          {saved.name} {!saved.enabled && <Badge variant="secondary">Nonaktif</Badge>}
        </div>
        <p className="text-muted-foreground truncate text-xs">{saved.description}</p>
        <p className="text-muted-foreground text-xs">
          {plansUsing.length ? plansUsing.join(", ") : "Belum ada paket"} · {storesUsing} toko
          {saved.style.radius ? ` · sudut ${saved.style.radius}` : ""}
          {saved.style.font ? ` · ${FONTS[saved.style.font]}` : ""}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        Aktif
        <Switch checked={saved.enabled} disabled={pending} onCheckedChange={(v) => save({ ...saved, enabled: v })} aria-label={`${saved.name} aktif`} />
      </label>
      <Dialog open={open} onOpenChange={openEditor}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil /> Ubah
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{saved.name}</DialogTitle>
            <DialogDescription>Nama dan deskripsi dilihat seller. Sudut & font berlaku untuk semua toko dengan template ini (kecuali toko yang memakai Tema AI).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`${template.id}-name`}>Nama</Label>
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
                <Label htmlFor={`${template.id}-accent`}>Aksen default</Label>
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
            <p className="text-muted-foreground text-xs">Aksen default dipakai toko yang belum memilih warnanya sendiri.</p>
          </div>
          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() =>
                save(
                  {
                    ...saved,
                    name: name.trim(),
                    description: description.trim(),
                    style: { radius: radius === "default" ? null : radius, font: font === "default" ? null : font, accent },
                  },
                  () => setOpen(false),
                )
              }
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
