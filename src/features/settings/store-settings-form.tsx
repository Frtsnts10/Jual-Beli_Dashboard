"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/image-upload";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { LayoutTemplate, Store } from "@/types/schema";
import { updateStoreSettings, type StoreSettingsInput } from "@/features/stores/actions";

export function StoreSettingsForm({
  store,
  allowedTemplates,
  templates,
  rootDomain,
}: {
  store: Store;
  allowedTemplates: LayoutTemplate[];
  /** Templates the platform offers (switched on, with admin-edited names). */
  templates: { id: LayoutTemplate; name: string; description: string }[];
  rootDomain?: string;
}) {
  const [form, setForm] = useState<StoreSettingsInput>({
    store_name: store.store_name,
    slug: store.slug,
    is_active: store.is_active,
    layout_template: store.storefront_config.layout_template,
    accent_color: store.storefront_config.accent_color,
    tagline: store.storefront_config.tagline ?? "",
    banner_url: store.storefront_config.banner_url ?? "",
    logo_url: store.storefront_config.logo_url ?? "",
  });
  const [pending, start] = useTransition();
  const set = <K extends keyof StoreSettingsInput>(k: K, v: StoreSettingsInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateStoreSettings(store.id, form);
          if (res.ok) toast.success("Pengaturan disimpan");
          else toast.error(res.error);
        });
      }}
      className="grid gap-6 [&>*]:min-w-0"
    >
      <Card>
        <CardHeader>
          <CardTitle>Profil toko</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0">
          <div className="grid gap-2">
            <Label htmlFor="store_name">Nama toko</Label>
            <Input id="store_name" value={form.store_name} onChange={(e) => set("store_name", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="slug">Slug{rootDomain ? ` (${form.slug || "slug"}.${rootDomain})` : ""}</Label>
            <Input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={form.tagline} maxLength={160} onChange={(e) => set("tagline", e.target.value)} placeholder="Akun premium murah, garansi full." />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Logo</Label>
            <ImageUpload storeId={store.id} kind="logo" aspect="aspect-square max-w-28" value={form.logo_url} onChange={(url) => set("logo_url", url)} label="Unggah logo" />
          </div>
          <div className="flex items-center justify-between md:col-span-2">
            <div>
              <Label htmlFor="active">Toko aktif</Label>
              <p className="text-muted-foreground text-xs">Jika nonaktif, etalase menampilkan halaman tutup.</p>
            </div>
            <Switch id="active" checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tampilan etalase</CardTitle>
          <CardDescription>Pilih salah satu dari 5 template.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 [&>*]:min-w-0">
          <div className="grid gap-2 [&>*]:min-w-0" role="radiogroup" aria-label="Template etalase">
            {templates.map((t) => {
              const locked = !allowedTemplates.includes(t.id) && t.id !== store.storefront_config.layout_template;
              const selected = form.layout_template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={locked}
                  onClick={() => set("layout_template", t.id)}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left transition",
                    selected ? "border-primary ring-primary/30 ring-2" : "hover:border-foreground/30",
                    locked && "cursor-not-allowed opacity-50"
                  )}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {t.name} {locked && <Lock className="size-3.5" />}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">{t.description}</p>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Label htmlFor="accent">Warna aksen</Label>
            <input id="accent" type="color" value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="h-9 w-12 rounded border" />
            <Input value={form.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="w-28 font-mono" />
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan…" : "Simpan pengaturan"}
          </Button>
        </CardFooter>
      </Card>

    </form>
  );
}
