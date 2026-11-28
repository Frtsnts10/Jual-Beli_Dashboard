"use client";

import { useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { autoTemplate, BASE_VARS, DELIVERY_TYPES, fieldKey, MAX_FIELDS, MAX_SLOTS, PRESET_FIELDS, type StockConfig } from "@/lib/stock-config";

/** "Stok & pengiriman": what one vault entry is, its columns, sharing slots and the WA message. */
export function StockConfigEditor({ value, onChange, storeTemplate }: { value: StockConfig; onChange: (v: StockConfig) => void; storeTemplate: boolean }) {
  const tpl = useRef<HTMLTextAreaElement>(null);
  // Columns added in this edit: their placeholder follows the name ("Catatan" → {catatan}). Saved
  // columns keep their key, so renaming "Email" never orphans the values already in the vault.
  const fresh = useRef(new Set<string>());
  const set = (patch: Partial<StockConfig>) => onChange({ ...value, ...patch });
  const setField = (i: number, patch: Partial<StockConfig["fields"][number]>) =>
    set({
      fields: value.fields.map((f, j) => {
        if (j !== i) return f;
        const next = { ...f, ...patch };
        if (patch.label !== undefined && fresh.current.has(f.key) && patch.label.trim()) {
          next.key = fieldKey(patch.label, new Set(value.fields.filter((_, k) => k !== i).map((x) => x.key)));
          fresh.current.delete(f.key);
          fresh.current.add(next.key);
        }
        return next;
      }),
    });

  const insert = (token: string) => {
    const el = tpl.current;
    const text = value.wa_template || autoTemplate(value);
    const at = el && value.wa_template ? el.selectionStart : text.length;
    set({ wa_template: text.slice(0, at) + token + text.slice(at) });
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <div className="grid gap-4 rounded-md border p-3">
      <div className="grid gap-2">
        <Label>Jenis stok</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {DELIVERY_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                if (t.value === value.type) return;
                fresh.current.clear();
                set({ type: t.value, fields: PRESET_FIELDS[t.value] });
              }}
              className={cn(
                "rounded-md border p-2 text-left text-sm transition-colors",
                t.value === value.type ? "border-primary bg-primary/5 ring-primary/20 ring-2" : "hover:bg-muted",
              )}
            >
              <div className="font-medium">{t.label}</div>
              <div className="text-muted-foreground text-xs">{t.hint}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Kolom di Brankas Stok</Label>
        <div className="grid gap-2">
          {value.fields.map((f, i) => (
            <div key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Input
                value={f.label}
                onChange={(e) => setField(i, { label: e.target.value })}
                maxLength={30}
                aria-label={`Nama kolom ${i + 1}`}
                className="h-8 w-40 flex-1 sm:flex-none"
              />
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={f.secret} onChange={(e) => setField(i, { secret: e.target.checked })} /> Rahasia
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input type="checkbox" checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} /> Wajib
              </label>
              <code className="text-muted-foreground text-xs">{`{${f.key}}`}</code>
              {value.fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="size-7" aria-label={`Hapus kolom ${f.label}`} onClick={() => set({ fields: value.fields.filter((_, j) => j !== i) })}>
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
        </div>
        {value.fields.length < MAX_FIELDS && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-self-start"
            onClick={() => {
              const label = "Kolom baru";
              const key = fieldKey(label, new Set(value.fields.map((f) => f.key)));
              fresh.current.add(key);
              set({ fields: [...value.fields, { key, label, secret: false, required: false }] });
            }}
          >
            <Plus /> Tambah kolom
          </Button>
        )}
        <p className="text-muted-foreground text-xs">Contoh kolom tambahan: Profil, Nomor slot, Catatan. Kolom rahasia dienkripsi dan disamarkan di tabel.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="slots">Akun sharing</Label>
        <div className="flex items-center gap-2 text-sm">
          1 stok dijual ke
          <Input
            id="slots"
            type="number"
            min={1}
            max={MAX_SLOTS}
            value={value.slots}
            onChange={(e) => set({ slots: Math.min(MAX_SLOTS, Math.max(1, Number(e.target.value) || 1)) })}
            className="h-8 w-20"
          />
          pembeli
        </div>
        <p className="text-muted-foreground text-xs">
          {value.slots > 1
            ? `Setiap stok bisa dibeli ${value.slots} orang; tiap pembeli dapat nomor slot ({slot}, mis. 2/${value.slots}). Berlaku untuk stok yang ditambahkan setelah ini.`
            : "1 = setiap stok untuk satu pembeli. Isi lebih dari 1 untuk akun sharing (mis. 1 akun Netflix untuk 5 profil)."}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="wa_template">Pesan WhatsApp produk ini</Label>
        <Textarea
          id="wa_template"
          ref={tpl}
          rows={6}
          value={value.wa_template}
          onChange={(e) => set({ wa_template: e.target.value })}
          placeholder={autoTemplate(value)}
          className="text-xs"
        />
        <div className="flex flex-wrap gap-1">
          {[...BASE_VARS, ...value.fields.map((f) => f.key)].map((k) => (
            <button key={k} type="button" onClick={() => insert(`{${k}}`)} className="bg-muted hover:bg-muted/70 rounded px-1.5 py-0.5 font-mono text-[11px]">
              {`{${k}}`}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          Kosongkan untuk memakai {storeTemplate ? "template toko (akun biasa) atau " : ""}pesan otomatis sesuai kolom di atas.
        </p>
      </div>
    </div>
  );
}
