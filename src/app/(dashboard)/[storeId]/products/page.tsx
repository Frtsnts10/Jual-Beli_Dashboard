import { Plus } from "lucide-react";
import { requireStore } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { listProducts, stockByProduct } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ProductDialog } from "@/features/products/product-dialog";
import { ProductsTable } from "@/features/products/products-table";

export const metadata = { title: "Produk" };

export default async function ProductsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  await requireStore(storeId);
  const [products, stock] = await Promise.all([listProducts(storeId), stockByProduct(storeId)]);

  // The storefront shows products.stock_available; resync it if it ever drifted from the vault.
  const drifted = products.filter((p) => p.stock_available !== (stock[p.id] ?? 0));
  if (drifted.length) {
    const batch = adminDb.batch();
    for (const p of drifted) batch.update(adminDb.collection("products").doc(p.id), { stock_available: stock[p.id] ?? 0 });
    await batch.commit();
  }

  return (
    <>
      <PageHeader title="Produk" description="Katalog yang tampil di etalase toko.">
        <ProductDialog
          storeId={storeId}
          trigger={
            <Button>
              <Plus /> Produk baru
            </Button>
          }
        />
      </PageHeader>
      <ProductsTable storeId={storeId} products={products} stock={stock} />
    </>
  );
}
