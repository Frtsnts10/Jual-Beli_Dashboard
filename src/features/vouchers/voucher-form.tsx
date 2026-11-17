"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { normaliseCode, type VoucherType } from "@/lib/voucher";
import { createVoucher, deleteVoucher, setVoucherActive } from "./actions";

const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(/\D/g, "")));

export function VoucherForm({ storeId, products }: { storeId: string; products: { id: string; title: string }[] }) {
  const empty = { code: "", type: "percent" as VoucherType, value: "", max_discount: "", min_amount: "", max_uses: "", expires_on: "", scope: "all" };
  const [f, setF] = useState(empty);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form
      className="grid gap-4 [&>*]:min-w-0"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await createVoucher(storeId, {
            code: f.code,
            type: f.type,
            value: num(f.value) ?? 0,
            max_discount: num(f.max_discount),
            min_amount: num(f.min_amount) ?? 0,
            max_uses: num(f.max_uses),
            expires_on: f.expires_on || null,
            product_ids: f.scope === "all" ? null : [f.scope],
          });
          if (!res.ok) return void toast.error(res.error);
          toast.success(`Voucher ${normaliseCode(f.code)} dibuat`);
          setF(empty);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
        <div className="grid gap-2">
          <Label htmlFor="v-code">Kode</Label>
          <Input id="v-code" required placeholder="HEMAT10" value={f.code} onChange={(e) => setF((s) => ({ ...s, code: normaliseCode(e.target.value) }))} maxLength={20} />
        </div>
        <div className="grid gap-2">
          <Label>Jenis potongan</Label>
          <Select value={f.type} onValueChange={(v) => setF((s) => ({ ...s, type: v as VoucherType }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Persen (%)</SelectItem>
              <SelectItem value="fixed">Nominal (Rp)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="v-value">{f.type === "percent" ? "Potongan (%)" : "Potongan (Rp)"}</Label>
          <Input id="v-value" required inputMode="numeric" placeholder={f.type === "percent" ? "10" : "5000"} value={f.value} onChange={set("value")} />
        </div>
        {f.type === "percent" && (
          <div className="grid gap-2">
            <Label htmlFor="v-max">Maks. potongan (Rp)</Label>
            <Input id="v-max" inputMode="numeric" placeholder="Opsional · tanpa batas" value={f.max_discount} onChange={set("max_discount")} />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="v-min">Minimal belanja (Rp)</Label>
          <Input id="v-min" inputMode="numeric" placeholder="0" value={f.min_amount} onChange={set("min_amount")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="v-uses">Kuota pemakaian</Label>
          <Input id="v-uses" inputMode="numeric" placeholder="Tanpa batas" value={f.max_uses} onChange={set("max_uses")} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="v-exp">Berlaku sampai</Label>
          <Input id="v-exp" type="date" value={f.expires_on} onChange={set("expires_on")} />
        </div>
        <div className="grid gap-2">
          <Label>Berlaku untuk</Label>
          <Select value={f.scope} onValueChange={(v) => setF((s) => ({ ...s, scope: v }))}>
            <SelectTrigger className="w-full min-w-0 [&>span]:truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua produk</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={pending || !f.code || !f.value} className="w-fit">
        <Plus /> {pending ? "Menyimpan…" : "Buat voucher"}
      </Button>
    </form>
  );
}

export function VoucherActions({ storeId, code, active, used }: { storeId: string; code: string; active: boolean; used: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={active}
        disabled={pending}
        aria-label={active ? `Nonaktifkan ${code}` : `Aktifkan ${code}`}
        onCheckedChange={(v) =>
          start(async () => {
            const res = await setVoucherActive(storeId, code, v);
            if (!res.ok) toast.error(res.error);
          })
        }
      />
      {used === 0 && (
        <Button
          size="icon"
          variant="ghost"
          disabled={pending}
          aria-label={`Hapus ${code}`}
          onClick={() => {
            if (!confirm(`Hapus voucher ${code}?`)) return;
            start(async () => {
              const res = await deleteVoucher(storeId, code);
              if (!res.ok) toast.error(res.error);
              else toast.success(`Voucher ${code} dihapus`);
            });
          }}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
