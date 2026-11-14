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
import { inspectDomain, routingRecords, vercelDomainsEnabled } from "@/lib/vercel-domains";
import { storefrontUrl } from "@/lib/store-url";
import { DomainCard } from "@/features/domains/domain-card";
import { StoreSettingsForm } from "@/features/settings/store-settings-form";
import { TeamCard } from "@/features/team/team-card";
import { BotsCard } from "@/features/bots/bots-card";
import { headers } from "next/headers";
import type { SubscriptionTier } from "@/types/schema";

export const metadata = { title: "Pengaturan" };

export default async function SettingsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { user, store, role, tier: plan } = await requireStore(storeId);
  const tier = TIERS[plan];
  const isOwner = role === "owner";
  const storeRef = adminDb.collection("stores").doc(storeId);
  const [integrations, vercelState, members, invites] = await Promise.all([
    adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get(),
    store.custom_domain && vercelDomainsEnabled() && store.custom_domain_status?.state !== "active"
      ? inspectDomain(store.custom_domain).catch(() => null)
      : null,
    isOwner ? storeRef.collection("members").get() : null,
    isOwner ? adminDb.collection("store_invites").where("store_id", "==", storeId).get() : null,
  ]);
  // Routing records, plus any TXT ownership challenge Vercel is asking for.
  const dnsRecords = store.custom_domain ? [...(vercelState?.verification ?? []), ...routingRecords(store.custom_domain)] : [];

  return (
    <>
      <PageHeader title="Pengaturan" description="Profil toko, tampilan etalase dan integrasi." />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="grid gap-6">
          {isOwner && (
          <DomainCard
            storeId={storeId}
            defaultUrl={storefrontUrl({ slug: store.slug, custom_domain: null })}
            allowed={tier.customDomain}
            domain={store.custom_domain}
            status={store.custom_domain_status ?? null}
            records={dnsRecords}
            automated={vercelDomainsEnabled()}
          />
          )}
          <StoreSettingsForm store={store} allowedTemplates={tier.templates} rootDomain={process.env.NEXT_PUBLIC_ROOT_DOMAIN} />
          {isOwner && <PaymentCard storeId={storeId} status={integrations.get("xendit_account_status") ?? null} feePercent={tier.feePercent} />}
          <IntegrationsForm
            storeId={storeId}
            provider={integrations.get("wa_api_provider") ?? null}
            hasToken={!!integrations.get("wa_api_token")}
            template={integrations.get("wa_message_template") ?? DEFAULT_WA_TEMPLATE}
            autoFulfillment={tier.autoFulfillment}
          />
          <BotsCard
            storeId={storeId}
            allowed={tier.marketing}
            telegramUsername={integrations.get("telegram_bot_username") ?? null}
            discordConnected={!!integrations.get("discord_public_key")}
            discordEndpoint={`${process.env.DASHBOARD_PUBLIC_URL ?? `https://${(await headers()).get("host")}`}/api/bots/discord/${storeId}`}
          />
          {isOwner && (
            <TeamCard
              storeId={storeId}
              ownerEmail={user.email}
              allowed={tier.multiAdmin}
              members={members?.docs.map((m) => ({ uid: m.id, email: m.get("email") as string })) ?? []}
              invites={invites?.docs.map((i) => ({ id: i.id, email: i.get("email") as string })) ?? []}
            />
          )}
        </div>
        {isOwner ? (
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
        ) : (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Anda admin <Badge variant="secondary">{tier.name}</Badge>
              </CardTitle>
              <CardDescription>Langganan, pencairan dana, domain dan tim dikelola pemilik toko.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
}
