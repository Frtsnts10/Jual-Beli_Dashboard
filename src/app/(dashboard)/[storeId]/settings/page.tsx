import { requireStore } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { formatDate, formatIDR } from "@/lib/utils";
import { DEFAULT_WA_TEMPLATE, TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IntegrationsForm } from "@/features/settings/integrations-form";
import { PaymentCard } from "@/features/settings/payment-card";
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
          <PaymentCard storeId={storeId} status={integrations.get("xendit_account_status") ?? null} feePercent={tier.feePercent} />
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
            <CardDescription>
              {user.subscription_tier === "starter" ? "Gratis selamanya." : `Aktif sampai ${formatDate(user.subscription_expiry)}.`}
            </CardDescription>
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
            <Button asChild className="mt-2">
              <Link href={`/${storeId}/billing`}>Kelola langganan</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
