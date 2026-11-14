import { Plus } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { adminDb } from "@/lib/firebase/admin";
import { listProducts, stockByProduct, waitingForRestock } from "@/lib/data/queries";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ProductDialog } from "@/features/products/product-dialog";
import { ProductsTable } from "@/features/products/products-table";

export const metadata = { title: "Produk" };

export default async function ProductsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { tier } = await requireStore(storeId);
  const [products, stock, waiting] = await Promise.all([listProducts(storeId), stockByProduct(storeId), waitingForRestock(storeId)]);

  // The storefront shows products.stock_available; resync it if it ever drifted from the vault.
  // Bundles have no vault stock of their own: they count as their scarcest component.
  const expected = (p: (typeof products)[number]) =>
    p.bundle_items ? Math.min(...p.bundle_items.map((id) => stock[id] ?? 0)) : (stock[p.id] ?? 0);
  const drifted = products.filter((p) => p.stock_available !== expected(p));
  if (drifted.length) {
    const batch = adminDb.batch();
    for (const p of drifted) batch.update(adminDb.collection("products").doc(p.id), { stock_available: expected(p) });
    await batch.commit();
  }

  return (
    <>
      <PageHeader title="Produk" description="Katalog yang tampil di etalase toko.">
        <ProductDialog
          storeId={storeId}
          flashSalePricing={TIERS[tier].marketing}
          bundleCandidates={products.filter((p) => !p.bundle_items).map((p) => ({ id: p.id, title: p.title }))}
          trigger={
            <Button>
              <Plus /> Produk baru
            </Button>
          }
        />
      </PageHeader>
      <ProductsTable storeId={storeId} products={products} stock={stock} waiting={waiting} flashSalePricing={TIERS[tier].marketing} />
    </>
  );
}
