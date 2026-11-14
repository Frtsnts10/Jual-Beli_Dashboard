import { requireStore } from "@/lib/access/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getCredentialsByIds, listOrders, listProducts } from "@/lib/data/queries";
import { DEFAULT_WA_TEMPLATE } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { OrdersTable } from "@/features/orders/orders-table";

export const metadata = { title: "Pesanan" };

export default async function OrdersPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { store } = await requireStore(storeId);
  const [orders, integrations] = await Promise.all([
    listOrders(storeId),
    adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get(),
  ]);
  const [credentials, products] = await Promise.all([getCredentialsByIds(orders.flatMap((o) => o.credential_ids)), listProducts(storeId)]);

  return (
    <>
      <PageHeader title="Pesanan" description="Transaksi, pengiriman akun dan klaim garansi." />
      <OrdersTable
        storeId={storeId}
        storeName={store.store_name}
        orders={orders}
        credentials={credentials}
        productTitles={Object.fromEntries(products.map((p) => [p.id, p.title]))}
        waTemplate={integrations.get("wa_message_template") ?? DEFAULT_WA_TEMPLATE}
      />
    </>
  );
}
