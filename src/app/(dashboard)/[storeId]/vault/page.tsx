import Link from "next/link";
import { requireStore } from "@/lib/auth";
import { countCredentials, listCredentials, listProducts } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { AddStockDialog } from "@/features/vault/add-stock-dialog";
import { VaultTable } from "@/features/vault/vault-table";
import type { CredentialStatus } from "@/types/schema";

export const metadata = { title: "Brankas Stok" };

const TABS: { status: CredentialStatus; label: string }[] = [
  { status: "AVAILABLE", label: "Tersedia" },
  { status: "SOLD", label: "Terjual" },
  { status: "EXPIRED", label: "Kedaluwarsa" },
];

export default async function VaultPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string; product?: string }>;
}) {
  const { storeId } = await params;
  const { status: rawStatus, product } = await searchParams;
  const status = TABS.find((t) => t.status === rawStatus)?.status ?? "AVAILABLE";
  const { user } = await requireStore(storeId);

  const [products, items, ...counts] = await Promise.all([
    listProducts(storeId),
    listCredentials(storeId, status),
    ...TABS.map((t) => countCredentials(storeId, t.status)),
  ]);
  const productTitles = Object.fromEntries(products.map((p) => [p.id, p.title]));
  const filtered = product ? items.filter((c) => c.product_id === product) : items;
  const tier = TIERS[user.subscription_tier];

  return (
    <>
      <PageHeader
        title="Brankas Stok"
        description={
          Number.isFinite(tier.maxCredentials)
            ? `Paket ${tier.name}: ${counts[0]}/${tier.maxCredentials} stok tersedia.`
            : "Gudang akun premium yang siap dikirim ke pembeli."
        }
      >
        <AddStockDialog storeId={storeId} products={products.map((p) => ({ id: p.id, title: p.title }))} defaultProductId={product} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="bg-muted inline-flex h-9 items-center rounded-lg p-[3px]">
          {TABS.map((t, i) => (
            <Link
              key={t.status}
              href={`?status=${t.status}${product ? `&product=${product}` : ""}`}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium",
                t.status === status ? "bg-background shadow-sm" : "text-muted-foreground"
              )}
            >
              {t.label} ({counts[i]})
            </Link>
          ))}
        </div>
        {product && (
          <Link href={`?status=${status}`} className="text-muted-foreground text-sm underline underline-offset-4">
            Filter: {productTitles[product] ?? "produk"} ✕
          </Link>
        )}
      </div>

      <VaultTable storeId={storeId} items={filtered} productTitles={productTitles} />
    </>
  );
}
