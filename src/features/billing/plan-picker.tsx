"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatIDR } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import type { BillingPeriod, SubscriptionTier } from "@/types/schema";
import { startSubscription } from "./actions";

const PERKS: Record<SubscriptionTier, string[]> = {
  starter: ["1 toko", "50 stok tersedia", "2 template", "Kirim akun manual via WA", "Bayar via QRIS toko, tanpa fee transaksi"],
  pro: ["3 toko", "Stok tanpa batas", "Semua 5 template", "Auto-kirim akun via WhatsApp", "Voucher & pengingat perpanjang", "Tanpa fee transaksi"],
  ultimate: ["Toko tanpa batas", "Custom domain", "Flash sale, broadcast & affiliate", "Multi-admin & bot Telegram/Discord", "Tanpa fee transaksi"],
};

export function PlanPicker({ storeId, currentTier }: { storeId: string; currentTier: SubscriptionTier }) {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <>
      <div className="bg-muted mb-6 inline-flex h-9 max-w-full items-center overflow-x-auto rounded-lg p-[3px]">
        {(["monthly", "yearly"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn("shrink-0 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap", period === p ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {p === "monthly" ? "Bulanan" : "Tahunan (gratis 2 bulan)"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 [&>*]:min-w-0">
        {(Object.keys(TIERS) as SubscriptionTier[]).map((key) => {
          const t = TIERS[key];
          const price = period === "yearly" ? t.priceYearly : t.priceMonthly;
          const current = key === currentTier;
          return (
            <Card key={key} className={current ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {t.name} {current && <Badge>Paket aktif</Badge>}
                </CardTitle>
                <CardDescription className="text-foreground text-2xl font-semibold">
                  {price ? formatIDR(price) : "Gratis"}
                  {price > 0 && <span className="text-muted-foreground text-sm font-normal">/{period === "yearly" ? "tahun" : "bulan"}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {PERKS[key].map((perk) => (
                  <div key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {perk}
                  </div>
                ))}
              </CardContent>
              <CardFooter className="mt-auto">
                {key !== "starter" && (
                  <Button
                    className="w-full"
                    variant={current ? "outline" : "default"}
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const res = await startSubscription(storeId, key, period);
                        if (!res.ok) return void toast.error(res.error);
                        router.refresh();
                        document.getElementById("bayar")?.scrollIntoView({ behavior: "smooth" });
                      })
                    }
                  >
                    {current ? "Perpanjang" : `Pilih ${t.name}`}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
