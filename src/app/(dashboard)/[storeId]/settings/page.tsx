import { requireStore } from "@/lib/access/auth";
import { adminDb } from "@/lib/firebase/admin";
import { formatDate, formatIDR } from "@/lib/utils";
import { DEFAULT_WA_TEMPLATE, TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IntegrationsForm } from "@/features/settings/integrations-form";
import { WaNotifyCard } from "@/features/settings/wa-notify-card";
import { QrisCard } from "@/features/payments/qris-card";
import { removeStoreQris, saveStoreQris } from "@/features/payments/actions";
import {
  inspectDomain,
  routingRecords,
  vercelDomainsEnabled,
} from "@/lib/integrations/vercel-domains";
import { storefrontUrl } from "@/lib/store-url";
import { DomainCard } from "@/features/domains/domain-card";
import { StoreSettingsForm } from "@/features/settings/store-settings-form";
import { StoreInfoForm } from "@/features/settings/store-info-form";
import { TeamCard } from "@/features/team/team-card";
import { BotsCard } from "@/features/bots/bots-card";
import { headers } from "next/headers";
import { segment, segmented } from "@/components/segmented";
import { HeroBannerCard } from "@/features/banner/hero-banner-card";
import { listProducts } from "@/lib/data/queries";
import type { SubscriptionTier } from "@/types/schema";

export const metadata = { title: "Pengaturan" };

const TABS = [
  { key: "toko", label: "Toko", owner: false },
  { key: "pembayaran", label: "Pembayaran", owner: true },
  { key: "domain", label: "Domain", owner: true },
  { key: "integrasi", label: "WhatsApp & Bot", owner: false },
  { key: "tim", label: "Tim", owner: true },
] as const;
type Tab = (typeof TABS)[number]["key"];

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { storeId } = await params;
  const { user, store, role, tier: plan } = await requireStore(storeId);
  const tier = TIERS[plan];
  const isOwner = role === "owner";
  // One section per tab (the page used to be eight cards in one long scroll).
  const tabs = TABS.filter((t) => isOwner || !t.owner);
  const requested = (await searchParams).tab;
  const tab: Tab = tabs.find((t) => t.key === requested)?.key ?? "toko";
  const storeRef = adminDb.collection("stores").doc(storeId);
  const [integrations, vercelState, members, invites, products] = await Promise.all([
    adminDb
      .collection("stores")
      .doc(storeId)
      .collection("private")
      .doc("integrations")
      .get(),
    store.custom_domain &&
    vercelDomainsEnabled() &&
    store.custom_domain_status?.state !== "active"
      ? inspectDomain(store.custom_domain).catch(() => null)
      : null,
    isOwner ? storeRef.collection("members").get() : null,
    isOwner
      ? adminDb
          .collection("store_invites")
          .where("store_id", "==", storeId)
          .get()
      : null,
    tab === "toko" ? listProducts(storeId) : Promise.resolve([]),
  ]);
  // Routing records, plus any TXT ownership challenge Vercel is asking for.
  const dnsRecords = store.custom_domain
    ? [
        ...(vercelState?.verification ?? []),
        ...routingRecords(store.custom_domain),
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Pengaturan"
        description="Profil toko, tampilan etalase, pembayaran dan integrasi."
      />
      <nav className={segmented("mb-6")} aria-label="Bagian pengaturan">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={segment(t.key === tab)}
            aria-current={t.key === tab ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
          {tab === "pembayaran" && (
            <QrisCard
              payment={store.payment}
              save={saveStoreQris.bind(null, storeId)}
              remove={removeStoreQris.bind(null, storeId)}
            />
          )}
          {tab === "domain" && (
            <DomainCard
              storeId={storeId}
              defaultUrl={storefrontUrl({
                slug: store.slug,
                custom_domain: null,
              })}
              allowed={tier.customDomain}
              domain={store.custom_domain}
              status={store.custom_domain_status ?? null}
              records={dnsRecords}
              automated={vercelDomainsEnabled()}
            />
          )}
          {tab === "toko" && (
            <>
              <StoreSettingsForm
                store={store}
                allowedTemplates={tier.templates}
                rootDomain={process.env.NEXT_PUBLIC_ROOT_DOMAIN}
              />
              <StoreInfoForm storeId={storeId} info={store.store_info} />
              <HeroBannerCard storeId={storeId} initial={store.hero_slides} products={products.map((p) => ({ id: p.id, title: p.title }))} />
            </>
          )}
          {tab === "integrasi" && (
            <>
              <IntegrationsForm
                storeId={storeId}
                provider={integrations.get("wa_api_provider") ?? null}
                hasToken={!!integrations.get("wa_api_token")}
                phoneNumberId={integrations.get("wa_phone_number_id") ?? null}
                server={integrations.get("wa_server") ?? null}
                template={
                  integrations.get("wa_message_template") ?? DEFAULT_WA_TEMPLATE
                }
                autoFulfillment={tier.autoFulfillment}
              />
              <WaNotifyCard
                storeId={storeId}
                allowed={tier.autoFulfillment}
                ready={!!integrations.get("wa_api_provider") && !!integrations.get("wa_api_token")}
                notifyBuyer={integrations.get("wa_notify_buyer") !== false}
                sellerPhone={integrations.get("wa_notify_seller_phone") ?? null}
              />
              <BotsCard
                storeId={storeId}
                allowed={tier.marketing}
                telegramUsername={
                  integrations.get("telegram_bot_username") ?? null
                }
                discordConnected={!!integrations.get("discord_public_key")}
                discordEndpoint={`${process.env.DASHBOARD_PUBLIC_URL ?? `https://${(await headers()).get("host")}`}/api/bots/discord/${storeId}`}
              />
            </>
          )}
          {tab === "tim" && (
            <TeamCard
              storeId={storeId}
              ownerEmail={user.email}
              allowed={tier.multiAdmin}
              members={
                members?.docs.map((m) => ({
                  uid: m.id,
                  email: m.get("email") as string,
                })) ?? []
              }
              invites={
                invites?.docs.map((i) => ({
                  id: i.id,
                  email: i.get("email") as string,
                })) ?? []
              }
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
                {user.subscription_tier === "starter"
                  ? "Gratis selamanya."
                  : `Aktif sampai ${formatDate(user.subscription_expiry)}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {(Object.keys(TIERS) as SubscriptionTier[]).map((key) => {
                const t = TIERS[key];
                return (
                  <div
                    key={key}
                    className={
                      key === user.subscription_tier
                        ? "font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {t.name} —{" "}
                    {t.priceMonthly
                      ? `${formatIDR(t.priceMonthly)}/bln`
                      : "Gratis"}{" "}
                    ·{" "}
                    {Number.isFinite(t.maxStores)
                      ? `${t.maxStores} toko`
                      : "toko tanpa batas"}
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
              <CardDescription>
                Langganan, QRIS pembayaran, domain dan tim dikelola pemilik
                toko.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </>
  );
}
