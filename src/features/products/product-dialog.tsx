"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PLATFORM_TYPES } from "@/config/tiers";
import type { PlatformType, Product } from "@/types/schema";
import { saveProduct, type ProductInput } from "./actions";

const empty: ProductInput = {
  title: "",
  description: "",
  image_url: "",
  platform_type: "Media",
  price: 25000,
  duration_days: 30,
  is_flash_sale: false,
  is_published: true,
};

export function ProductDialog({ storeId, product, trigger }: { storeId: string; product?: Product; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductInput>(empty);
  const [pending, start] = useTransition();
  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setForm(product ? { ...product, image_url: product.image_url ?? "" } : empty);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? "Edit produk" : "Produk baru"}</DialogTitle>
        </DialogHeader>
        <form
          id="product-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await saveProduct(storeId, product?.id ?? null, form);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Produk disimpan");
              setOpen(false);
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Netflix Premium 1 Bulan" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Kategori</Label>
              <Select value={form.platform_type} onValueChange={(v) => set("platform_type", v as PlatformType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input id="price" type="number" min={1000} step={500} value={form.price} onChange={(e) => set("price", Number(e.target.value))} required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Masa aktif (hari)</Label>
            <Input id="duration" type="number" min={1} value={form.duration_days} onChange={(e) => set("duration_days", Number(e.target.value))} required />
            <p className="text-muted-foreground text-xs">Dipakai jika stok di brankas tidak punya tanggal kedaluwarsa sendiri.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image">URL gambar</Label>
            <Input id="image" value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="published">Tampil di etalase</Label>
            <Switch id="published" checked={form.is_published} onCheckedChange={(v) => set("is_published", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="flash">Label flash sale</Label>
            <Switch id="flash" checked={form.is_flash_sale} onCheckedChange={(v) => set("is_flash_sale", v)} />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="product-form" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
