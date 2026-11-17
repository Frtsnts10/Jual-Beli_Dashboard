"use client";

/* eslint-disable @next/next/no-img-element -- seller-uploaded banners */
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/image-upload";
import type { HeroSlide } from "@/types/schema";
import { saveHeroSlides } from "./actions";

const MAX = 5;
const blank = (): HeroSlide => ({
  id: Math.random().toString(36).slice(2, 12),
  image_url: "",
  image_mobile_url: null,
  title: "",
  subtitle: "",
  cta_label: "",
  cta_target: "",
  active: true,
});

/**
 * Pengaturan → Toko → Banner hero: up to 5 slides shown at the top of the storefront (a
 * carousel when there are several), in every template. Every change is saved right away.
 */
export function HeroBannerCard({ storeId, initial, products }: { storeId: string; initial: HeroSlide[]; products: { id: string; title: string }[] }) {
  const [slides, setSlides] = useState(initial);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [pending, start] = useTransition();

  const persist = (next: HeroSlide[], msg: string, after?: () => void) =>
    start(async () => {
      const res = await saveHeroSlides(storeId, next);
      if (!res.ok) return void toast.error(res.error);
      setSlides(next);
      toast.success(msg);
      after?.();
    });
  const move = (i: number, d: -1 | 1) => {
    const next = [...slides];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    persist(next, "Urutan disimpan");
  };
  const productTitle = (id: string) => products.find((p) => p.id === id)?.title;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Banner hero</CardTitle>
        <CardDescription>
          Tampil paling atas di website toko, di semua template. Lebih dari satu slide = bergeser otomatis. Ukuran ideal 1920×720 px (versi HP opsional,
          1080×1080).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {slides.length === 0 && <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">Belum ada banner.</p>}
        {slides.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-md border p-2">
            <img src={s.image_url} alt="" className="aspect-[8/3] w-28 shrink-0 rounded-md object-cover sm:w-40" />
            <div className="min-w-0 flex-1 text-sm">
              <div className="truncate font-medium">{s.title || "(tanpa judul)"}</div>
              <div className="text-muted-foreground truncate text-xs">
                {s.cta_label ? `${s.cta_label} → ${productTitle(s.cta_target) ?? s.cta_target}` : "Tanpa tombol"}
              </div>
            </div>
            <Switch
              checked={s.active}
              disabled={pending}
              aria-label={s.active ? "Sembunyikan slide" : "Tampilkan slide"}
              onCheckedChange={(v) => persist(slides.map((x) => (x.id === s.id ? { ...x, active: v } : x)), v ? "Slide ditampilkan" : "Slide disembunyikan")}
            />
            <div className="hidden items-center sm:flex">
              <Button variant="ghost" size="icon" aria-label="Naikkan" disabled={pending || i === 0} onClick={() => move(i, -1)}>
                <ArrowUp />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Turunkan" disabled={pending || i === slides.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown />
              </Button>
            </div>
            <Button variant="ghost" size="icon" aria-label="Ubah slide" onClick={() => setEditing(s)}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Hapus slide"
              disabled={pending}
              onClick={() => confirm("Hapus slide ini?") && persist(slides.filter((x) => x.id !== s.id), "Slide dihapus")}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <div className="flex justify-end">
          <Button variant="outline" disabled={slides.length >= MAX} onClick={() => setEditing(blank())}>
            <Plus /> Tambah slide {slides.length >= MAX && `(maks ${MAX})`}
          </Button>
        </div>
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{slides.some((s) => s.id === editing.id) ? "Ubah slide" : "Slide baru"}</DialogTitle>
              <DialogDescription>Teks tampil di atas gambar. Semua kolom teks boleh dikosongkan.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Gambar (desktop)</Label>
                <ImageUpload storeId={storeId} kind="banner" aspect="aspect-[8/3] max-w-full" value={editing.image_url} onChange={(url) => setEditing({ ...editing, image_url: url })} label="Unggah banner" />
              </div>
              <div className="grid gap-2">
                <Label>Gambar versi HP (opsional)</Label>
                <ImageUpload
                  storeId={storeId}
                  kind="banner"
                  aspect="aspect-square max-w-40"
                  value={editing.image_mobile_url ?? ""}
                  onChange={(url) => setEditing({ ...editing, image_mobile_url: url || null })}
                  label="Unggah versi HP"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hs-title">Judul</Label>
                <Input id="hs-title" maxLength={80} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Promo akhir tahun" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hs-sub">Subjudul</Label>
                <Input id="hs-sub" maxLength={160} value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} placeholder="Diskon sampai 30% semua akun premium" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 [&>*]:min-w-0">
                <div className="grid gap-2">
                  <Label htmlFor="hs-cta">Teks tombol</Label>
                  <Input id="hs-cta" maxLength={30} value={editing.cta_label} onChange={(e) => setEditing({ ...editing, cta_label: e.target.value })} placeholder="Beli sekarang" />
                </div>
                <div className="grid gap-2">
                  <Label>Tujuan tombol</Label>
                  <Select
                    value={products.some((p) => p.id === editing.cta_target) ? editing.cta_target : editing.cta_target ? "__url" : "__none"}
                    onValueChange={(v) => setEditing({ ...editing, cta_target: v === "__none" ? "" : v === "__url" ? "https://" : v })}
                  >
                    <SelectTrigger className="w-full min-w-0 [&>span]:truncate">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Tanpa tombol</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="__url">Link lain…</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editing.cta_target && !products.some((p) => p.id === editing.cta_target) && (
                <Input value={editing.cta_target} onChange={(e) => setEditing({ ...editing, cta_target: e.target.value.trim() })} placeholder="https://…" aria-label="Link tujuan" />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button
                disabled={pending || !editing.image_url}
                onClick={() => {
                  const exists = slides.some((s) => s.id === editing.id);
                  persist(exists ? slides.map((s) => (s.id === editing.id ? editing : s)) : [...slides, editing], "Banner disimpan", () => setEditing(null));
                }}
              >
                <ImagePlus /> Simpan slide
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
}
