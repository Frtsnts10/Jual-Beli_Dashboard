import { requireStore } from "@/lib/access/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getCredentialsByIds, listOrders, listProducts } from "@/lib/data/queries";
import { DEFAULT_WA_TEMPLATE } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { OrdersTable } from "@/features/orders/orders-table";
import { expireUnpaidOrders } from "@/lib/payments/manual";

export const metadata = { title: "Pesanan" };

export default async function OrdersPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { store } = await requireStore(storeId);
  // QRIS orders not paid in time fail here (and nightly by cron), freeing their voucher use.
  await expireUnpaidOrders(storeId);
  const [orders, integrations] = await Promise.all([
    listOrders(storeId),
    adminDb.collection("stores").doc(storeId).collection("private").doc("integrations").get(),
  ]);
  const [credentials, products] = await Promise.all([getCredentialsByIds(orders.flatMap((o) => o.credential_ids)), listProducts(storeId)]);

  return (
    <>
      <PageHeader title="Pesanan" description="Konfirmasi pembayaran QRIS, pengiriman akun dan klaim garansi." />
      {!store.payment && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          Pembeli belum bisa checkout: upload QRIS toko Anda di <a href={`/${storeId}/settings#pembayaran`} className="font-medium underline">Pengaturan → Pembayaran</a>.
        </p>
      )}
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
