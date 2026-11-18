"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { FEATURE_INFO, FEATURE_KEYS, type FeatureKey, type FeatureOverrides } from "@/lib/catalog-core";
import type { LayoutTemplate } from "@/types/schema";
import { setFeatureOverrides } from "./catalog-actions";
import { LimitField } from "./plan-form";

type Tri = "plan" | "on" | "off";

/** Admin → Pengguna: per-seller exceptions to their plan. */
export function OverridesDialog({
  uid,
  email,
  planName,
  planFeatures,
  overrides,
  templates,
}: {
  uid: string;
  email: string;
  planName: string;
  planFeatures: Record<FeatureKey, boolean>;
  overrides: FeatureOverrides;
  templates: { id: LayoutTemplate; name: string; inPlan: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const [features, setFeatures] = useState<Record<FeatureKey, Tri>>(
    Object.fromEntries(FEATURE_KEYS.map((k) => [k, overrides.features?.[k] === undefined ? "plan" : overrides.features[k] ? "on" : "off"])) as Record<FeatureKey, Tri>
  );
  const [extra, setExtra] = useState<LayoutTemplate[]>(overrides.templates ?? []);
  const [customStores, setCustomStores] = useState(overrides.maxStores !== undefined);
  const [maxStores, setMaxStores] = useState<number | null>(overrides.maxStores ?? 1);
  const [customCreds, setCustomCreds] = useState(overrides.maxCredentials !== undefined);
  const [maxCredentials, setMaxCredentials] = useState<number | null>(overrides.maxCredentials ?? 100);
  const [pending, start] = useTransition();
  const count = Object.values(features).filter((v) => v !== "plan").length + extra.length + Number(customStores) + Number(customCreds);

  const save = () =>
    start(async () => {
      const f = Object.fromEntries(Object.entries(features).filter(([, v]) => v !== "plan").map(([k, v]) => [k, v === "on"]));
      const res = await setFeatureOverrides(uid, {
        features: f,
        templates: extra,
        ...(customStores ? { maxStores } : {}),
        ...(customCreds ? { maxCredentials } : {}),
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Fitur khusus disimpan");
      setOpen(false);
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={count ? "secondary" : "ghost"} size="sm">
          <Sparkles /> Fitur khusus{count ? ` (${count})` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fitur khusus</DialogTitle>
          <DialogDescription className="break-all">
            {email} · paket {planName}. Pengecualian ini menimpa isi paket, hanya untuk seller ini.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {FEATURE_KEYS.map((k) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <div className="min-w-0 text-sm">
                {FEATURE_INFO[k].label}
                <div className="text-muted-foreground text-xs">Paket: {planFeatures[k] ? "aktif" : "nonaktif"}</div>
              </div>
              <Select value={features[k]} onValueChange={(v) => setFeatures((f) => ({ ...f, [k]: v as Tri }))}>
                <SelectTrigger className="w-36" aria-label={FEATURE_INFO[k].label}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">Ikut paket</SelectItem>
                  <SelectItem value="on">Aktifkan</SelectItem>
                  <SelectItem value="off">Matikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
          <div className="grid gap-2">
            <Label>Template tambahan</Label>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => {
                const on = t.inPlan || extra.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={t.inPlan}
                    aria-pressed={on}
                    onClick={() => setExtra((x) => (x.includes(t.id) ? x.filter((i) => i !== t.id) : [...x, t.id]))}
                    className={cn("rounded-md border px-2.5 py-1 text-xs", on ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground", t.inPlan && "opacity-60")}
                    title={t.inPlan ? "Sudah termasuk paket" : undefined}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-3">
            <label className="flex items-center justify-between text-sm">
              Batas toko khusus <Switch checked={customStores} onCheckedChange={setCustomStores} />
            </label>
            {customStores && <LimitField id={`${uid}-stores`} label="Maks. toko" value={maxStores} onChange={setMaxStores} />}
            <label className="flex items-center justify-between text-sm">
              Batas stok khusus <Switch checked={customCreds} onCheckedChange={setCustomCreds} />
            </label>
            {customCreds && <LimitField id={`${uid}-creds`} label="Maks. stok tersedia" value={maxCredentials} onChange={setMaxCredentials} />}
          </div>
        </div>
        <DialogFooter>
          <Button disabled={pending} onClick={save}>
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
