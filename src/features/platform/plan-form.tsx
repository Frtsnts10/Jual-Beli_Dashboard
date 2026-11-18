"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FEATURE_INFO, FEATURE_KEYS, type FeatureKey } from "@/lib/catalog-core";
import type { TierConfig } from "@/config/tiers";
import type { LayoutTemplate, SubscriptionTier } from "@/types/schema";
import { savePlan } from "./catalog-actions";

/** Number field with an "∞" toggle (null = unlimited). */
export function LimitField({ id, label, value, onChange }: { id: string; label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" min={1} disabled={value === null} value={value ?? ""} placeholder="∞" onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
      <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Switch checked={value === null} onCheckedChange={(on) => onChange(on ? null : 1)} aria-label={`${label} tanpa batas`} /> Tanpa batas
      </label>
    </div>
  );
}

const fin = (v: number) => (Number.isFinite(v) ? v : null);

export function PlanForm({ tier, plan, templates }: { tier: SubscriptionTier; plan: TierConfig; templates: { id: LayoutTemplate; name: string; enabled: boolean }[] }) {
  const [name, setName] = useState(plan.name);
  const [priceMonthly, setPriceMonthly] = useState(plan.priceMonthly);
  const [priceYearly, setPriceYearly] = useState(plan.priceYearly);
  const [maxStores, setMaxStores] = useState<number | null>(fin(plan.maxStores));
  const [maxCredentials, setMaxCredentials] = useState<number | null>(fin(plan.maxCredentials));
  const [tpl, setTpl] = useState<LayoutTemplate[]>(plan.templates);
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>(Object.fromEntries(FEATURE_KEYS.map((k) => [k, plan[k]])) as Record<FeatureKey, boolean>);
  const [pending, start] = useTransition();
  const free = tier === "starter";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{name || tier}</CardTitle>
        <CardDescription>{free ? "Paket gratis untuk semua seller baru." : "Paket berbayar lewat QRIS platform."}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${tier}-name`}>Nama paket</Label>
          <Input id={`${tier}-name`} maxLength={30} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {!free && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`${tier}-pm`}>Harga / bulan (Rp)</Label>
              <Input id={`${tier}-pm`} type="number" min={1000} value={priceMonthly} onChange={(e) => setPriceMonthly(Math.floor(Number(e.target.value) || 0))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${tier}-py`}>Harga / tahun (Rp)</Label>
              <Input id={`${tier}-py`} type="number" min={1000} value={priceYearly} onChange={(e) => setPriceYearly(Math.floor(Number(e.target.value) || 0))} />
            </div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <LimitField id={`${tier}-stores`} label="Maks. toko" value={maxStores} onChange={setMaxStores} />
          <LimitField id={`${tier}-creds`} label="Maks. stok tersedia" value={maxCredentials} onChange={setMaxCredentials} />
        </div>
        <div className="grid gap-2">
          <Label>Template etalase</Label>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => {
              const on = tpl.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setTpl((x) => (on ? x.filter((i) => i !== t.id) : [...x, t.id]))}
                  className={cn("rounded-md border px-2.5 py-1 text-xs", on ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground", !t.enabled && "line-through opacity-60")}
                  title={t.enabled ? undefined : "Template ini dinonaktifkan di menu Tema"}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-3">
          <Label>Fitur</Label>
          {FEATURE_KEYS.map((k) => (
            <div key={k} className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm">{FEATURE_INFO[k].label}</div>
                <div className="text-muted-foreground text-xs">{FEATURE_INFO[k].description}</div>
              </div>
              <Switch checked={features[k]} onCheckedChange={(v) => setFeatures((f) => ({ ...f, [k]: v }))} aria-label={FEATURE_INFO[k].label} />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await savePlan(tier, { name, priceMonthly: free ? 0 : priceMonthly, priceYearly: free ? 0 : priceYearly, maxStores, maxCredentials, templates: tpl, features });
              if (!res.ok) return void toast.error(res.error);
              toast.success(`Paket ${name} disimpan`);
            })
          }
        >
          Simpan paket
        </Button>
      </CardFooter>
    </Card>
  );
}
