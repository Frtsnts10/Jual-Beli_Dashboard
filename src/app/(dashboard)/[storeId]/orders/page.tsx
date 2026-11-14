import { requireStore } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getCredentialsByIds, listOrders } from "@/lib/queries";
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
  const credentials = await getCredentialsByIds(orders.map((o) => o.credential_id).filter((id): id is string => !!id));

  return (
    <>
      <PageHeader title="Pesanan" description="Transaksi, pengiriman akun dan klaim garansi." />
      <OrdersTable
        storeId={storeId}
        storeName={store.store_name}
        orders={orders}
        credentials={credentials}
        waTemplate={integrations.get("wa_message_template") ?? DEFAULT_WA_TEMPLATE}
      />
    </>
  );
}
