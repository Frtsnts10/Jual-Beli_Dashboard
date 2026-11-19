"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatIDR } from "@/lib/utils";
import type { TierConfig } from "@/config/tiers";
import { planPerks } from "@/lib/catalog-core";
import { bonusDays, planChange } from "@/lib/billing/plan-change";
import type { BillingPeriod, SubscriptionTier } from "@/types/schema";
import { startSubscription, switchToStarter } from "./actions";
import { segment, segmented } from "@/components/segmented";


export function PlanPicker({
  storeId,
  currentTier,
  expiry,
  canBuy,
  plans,
  planKeys,
}: {
  storeId: string;
  /** The platform catalog's plans (names, prices, contents). */
  plans: Record<SubscriptionTier, TierConfig>;
  /** Display order (catalog.planKeys). */
  planKeys: SubscriptionTier[];
  currentTier: SubscriptionTier;
  expiry: string | null;
  /** False while the platform has no QRIS to pay plans into. */
  canBuy: boolean;
}) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const prices = Object.fromEntries(planKeys.map((k) => [k, plans[k].priceMonthly]));
  const [pending, start] = useTransition();
  const router = useRouter();
  const [now] = useState(() => Date.now());

  const buy = (key: SubscriptionTier) =>
    start(async () => {
      const res = await startSubscription(storeId, key, period);
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
      document.getElementById("bayar")?.scrollIntoView({ behavior: "smooth" });
    });

  return (
    <>
      <div className={segmented("mb-6")}>
        {(["monthly", "yearly"] as const).map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)} className={segment(period === p)}>
            {p === "monthly" ? "Bulanan" : "Tahunan (gratis 2 bulan)"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        {planKeys.map((key) => {
          const t = plans[key];
          const price = period === "yearly" ? t.priceYearly : t.priceMonthly;
          const current = key === currentTier;
          const change = planChange(currentTier, expiry, key, now, prices);
          const bonus = bonusDays(currentTier, expiry, key, now, prices);
          return (
            <Card key={key} className={current ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex h-6 items-center gap-2">
                  {t.name} {current && <Badge>Paket aktif</Badge>}
                </CardTitle>
                <CardDescription className="text-foreground text-2xl font-semibold">
                  {price ? formatIDR(price) : "Gratis"}
                  {price > 0 && <span className="text-muted-foreground text-sm font-normal">/{period === "yearly" ? "tahun" : "bulan"}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {planPerks(t).map((perk) => (
                  <div key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {perk}
                  </div>
                ))}
              </CardContent>
              <CardFooter className="mt-auto grid gap-2">
                {key === "starter" ? (
                  currentTier !== "starter" && (
                    <>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={pending}
                        onClick={() => {
                          if (!confirm(`Pindah ke Starter sekarang? Sisa paket ${plans[currentTier].name} sampai ${formatDate(expiry)} tidak dikembalikan.`)) return;
                          start(async () => {
                            const res = await switchToStarter(storeId);
                            if (!res.ok) return void toast.error(res.error);
                            toast.success("Paket sekarang Starter");
                            router.refresh();
                          });
                        }}
                      >
                        <ArrowDown /> Pindah ke Starter sekarang
                      </Button>
                      <p className="text-muted-foreground text-xs">Atau biarkan saja: kembali ke Starter otomatis setelah {formatDate(expiry)} bila tidak diperpanjang.</p>
                    </>
                  )
                ) : (
                  <>
                    <Button className="w-full" variant={current ? "outline" : "default"} disabled={pending || !canBuy} onClick={() => buy(key)}>
                      {change === "upgrade" && <ArrowUp />}
                      {change === "downgrade" && <ArrowDown />}
                      {change === "renew" ? "Perpanjang" : change === "upgrade" ? `Upgrade ke ${t.name}` : change === "downgrade" ? `Turun ke ${t.name}` : `Pilih ${t.name}`}
                    </Button>
                    {bonus > 0 && (
                      <p className="text-muted-foreground text-xs">
                        Mulai hari ini. Sisa paket {plans[currentTier].name} Anda jadi <b className="text-foreground">bonus {bonus} hari</b> — total{" "}
                        {(period === "yearly" ? 365 : 30) + bonus} hari {t.name}.
                      </p>
                    )}
                    {change === "renew" && <p className="text-muted-foreground text-xs">Ditambahkan setelah {formatDate(expiry)}.</p>}
                  </>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
