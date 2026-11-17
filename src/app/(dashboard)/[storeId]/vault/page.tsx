import Link from "next/link";
import { requireStore } from "@/lib/access/auth";
import { countCredentials, listCredentials, listProducts } from "@/lib/data/queries";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { AddStockDialog } from "@/features/vault/add-stock-dialog";
import { ImportDialog } from "@/features/import/import-dialog";
import { VaultTable } from "@/features/vault/vault-table";
import type { CredentialStatus } from "@/types/schema";
import { segment, segmented } from "@/components/segmented";
import { Pager } from "@/components/pager";
import { paginate } from "@/lib/paging";

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
  searchParams: Promise<{ status?: string; product?: string; page?: string; size?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const { status: rawStatus, product } = sp;
  const status = TABS.find((t) => t.status === rawStatus)?.status ?? "AVAILABLE";
  const { tier: plan } = await requireStore(storeId);

  const [products, items, ...counts] = await Promise.all([
    listProducts(storeId),
    listCredentials(storeId, status),
    ...TABS.map((t) => countCredentials(storeId, t.status)),
  ]);
  const productTitles = Object.fromEntries(products.map((p) => [p.id, p.title]));
  const filtered = product ? items.filter((c) => c.product_id === product) : items;
  const tier = TIERS[plan];
  const { rows, ...pager } = paginate(filtered, sp, 10);

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
        <ImportDialog storeId={storeId} kind="stock" products={products.filter((p) => !p.bundle_items).map((p) => ({ id: p.id, title: p.title }))} />
        <AddStockDialog
          storeId={storeId}
          products={products.filter((p) => !p.bundle_items).map((p) => ({ id: p.id, title: p.title }))}
          defaultProductId={product}
        />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className={segmented()}>
          {TABS.map((t, i) => (
            <Link
              key={t.status}
              href={`?status=${t.status}${product ? `&product=${product}` : ""}`}
              className={segment(t.status === status)}
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

      <VaultTable storeId={storeId} items={rows} productTitles={productTitles} />
      <Pager {...pager} className="mt-4" />
    </>
  );
}
