"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoreInfo } from "@/types/schema";
import { updateStoreInfo } from "@/features/stores/actions";

/** "Info toko": the storefront's Tentang / FAQ / Kebijakan garansi pages and the WhatsApp chat button. */
export function StoreInfoForm({ storeId, info }: { storeId: string; info: StoreInfo }) {
  const [form, setForm] = useState<StoreInfo>({ ...info, faq: info.faq.length ? info.faq : [] });
  const [pending, start] = useTransition();
  const set = <K extends keyof StoreInfo>(k: K, v: StoreInfo[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setFaq = (i: number, key: "q" | "a", v: string) => set("faq", form.faq.map((f, j) => (j === i ? { ...f, [key]: v } : f)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await updateStoreInfo(storeId, form);
          if (res.ok) toast.success("Info toko disimpan");
          else toast.error(res.error);
        });
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Info toko</CardTitle>
          <CardDescription>Tampil di etalase: halaman Tentang, FAQ dan Kebijakan garansi, plus tombol chat WhatsApp. Kosongkan yang tidak dipakai.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 [&>*]:min-w-0">
          <div className="grid gap-2">
            <Label htmlFor="wa">Nomor WhatsApp penjual</Label>
            <Input id="wa" inputMode="tel" placeholder="0812xxxxxxx" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            <p className="text-muted-foreground text-xs">Pembeli bisa langsung chat Anda dari tombol WhatsApp di etalase.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="about">Tentang toko</Label>
            <Textarea id="about" rows={4} placeholder="Ceritakan toko Anda, jam operasional, dll." value={form.about} onChange={(e) => set("about", e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="warranty">Kebijakan garansi</Label>
            <Textarea
              id="warranty"
              rows={4}
              placeholder="Mis. Garansi penuh selama masa aktif. Klaim lewat halaman Lacak pesanan, diganti maksimal 1×24 jam."
              value={form.warranty_policy}
              onChange={(e) => set("warranty_policy", e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label>FAQ</Label>
            {form.faq.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-md border p-3">
                <div className="flex gap-2">
                  <Input placeholder="Pertanyaan" value={f.q} onChange={(e) => setFaq(i, "q", e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Hapus pertanyaan" onClick={() => set("faq", form.faq.filter((_, j) => j !== i))}>
                    <Trash2 />
                  </Button>
                </div>
                <Textarea rows={2} placeholder="Jawaban" value={f.a} onChange={(e) => setFaq(i, "a", e.target.value)} />
              </div>
            ))}
            <Button type="button" variant="outline" className="w-fit" onClick={() => set("faq", [...form.faq, { q: "", a: "" }])}>
              <Plus /> Tambah pertanyaan
            </Button>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            Simpan info toko
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
