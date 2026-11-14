import { requireStore } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { formatIDR } from "@/lib/utils";
import { DEFAULT_WA_TEMPLATE, TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationsForm } from "@/features/settings/integrations-form";
import { StoreSettingsForm } from "@/features/settings/store-settings-form";
import type { SubscriptionTier } from "@/types/schema";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { user, store } = await requireStore(storeId);
  const tier = TIERS[user.subscription_tier];
  const integrations = await adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get();

  return (
    <>
      <PageHeader title="Pengaturan" description="Profil toko, tampilan etalase dan integrasi." />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          <StoreSettingsForm
            store={store}
            allowedTemplates={tier.templates}
            customDomainAllowed={tier.customDomain}
            rootDomain={process.env.NEXT_PUBLIC_ROOT_DOMAIN}
          />
          <IntegrationsForm
            storeId={storeId}
            provider={integrations.get("wa_api_provider") ?? null}
            hasToken={!!integrations.get("wa_api_token")}
            template={integrations.get("wa_message_template") ?? DEFAULT_WA_TEMPLATE}
            autoFulfillment={tier.autoFulfillment}
          />
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Paket <Badge>{tier.name}</Badge>
            </CardTitle>
            <CardDescription>Upgrade & pembayaran langganan hadir di fase berikutnya.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {(Object.keys(TIERS) as SubscriptionTier[]).map((key) => {
              const t = TIERS[key];
              return (
                <div key={key} className={key === user.subscription_tier ? "font-medium" : "text-muted-foreground"}>
                  {t.name} — {t.priceMonthly ? `${formatIDR(t.priceMonthly)}/bln` : "Gratis"} · fee {t.feePercent}% ·{" "}
                  {Number.isFinite(t.maxStores) ? `${t.maxStores} toko` : "toko tanpa batas"}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
