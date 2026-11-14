import Link from "next/link";
import { Check } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriptionTier } from "@/types/schema";

const PERKS: Record<SubscriptionTier, string[]> = {
  starter: ["1 toko", "50 stok akun", "Checkout QRIS & e-wallet", "2 template etalase", "Kirim akun manual via WA"],
  pro: ["3 toko", "Stok tanpa batas", "Auto-kirim akun via WhatsApp", "Pengingat perpanjangan H-3", "Klaim garansi 1-klik", "Semua 5 template"],
  ultimate: ["Toko & admin tanpa batas", "Custom domain", "WhatsApp broadcast CRM", "Flash sale, bundling, affiliate", "Bot Discord & Telegram"],
};

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-16 flex items-center justify-between">
        <span className="text-lg font-semibold">Toko Digital</span>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Masuk</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Daftar gratis</Link>
          </Button>
        </div>
      </header>
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Jual akun premium, otomatis.</h1>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
          Etalase siap pakai, checkout 2 langkah, brankas stok dan pengiriman akun lewat WhatsApp — dalam satu dashboard.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {(Object.keys(TIERS) as SubscriptionTier[]).map((key) => {
          const t = TIERS[key];
          return (
            <Card key={key} className={key === "pro" ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription className="text-foreground text-2xl font-semibold">
                  {t.priceMonthly ? formatIDR(t.priceMonthly) : "Rp 0"}
                  <span className="text-muted-foreground text-sm font-normal">/bulan</span>
                </CardDescription>
                <p className="text-muted-foreground text-xs">
                  {t.priceYearly ? `${formatIDR(t.priceYearly)}/tahun (gratis 2 bulan) · ` : ""}fee transaksi {t.feePercent}%
                </p>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {PERKS[key].map((perk) => (
                  <div key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" /> {perk}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
