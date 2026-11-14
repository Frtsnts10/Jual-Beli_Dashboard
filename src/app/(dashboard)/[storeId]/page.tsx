import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { requireStore } from "@/lib/auth";
import { countCredentials, countOpenClaims, listOrders, listProducts } from "@/lib/queries";
import { formatDate, formatIDR } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ringkasan" };

export default async function OverviewPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { store, tier: plan } = await requireStore(storeId);
  const [orders, products, available, claims] = await Promise.all([
    listOrders(storeId, 500),
    listProducts(storeId),
    countCredentials(storeId, "AVAILABLE"),
    countOpenClaims(storeId),
  ]);
  const tier = TIERS[plan];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const paid = orders.filter((o) => o.payment_status === "PAID");
  const paidThisMonth = paid.filter((o) => o.paid_at && new Date(o.paid_at) >= monthStart);
  const revenue = paidThisMonth.reduce((sum, o) => sum + o.amount, 0);
  const needsStock = paid.filter((o) => o.needs_stock).length;
  const toDeliver = paid.filter((o) => o.credential_id && o.delivery_status === "PENDING").length;

  const stats = [
    { label: "Pendapatan bulan ini", value: formatIDR(revenue), hint: `${paidThisMonth.length} pesanan lunas` },
    { label: "Stok tersedia", value: String(available), hint: Number.isFinite(tier.maxCredentials) ? `Kuota ${tier.maxCredentials}` : "Tanpa batas" },
    { label: "Produk aktif", value: String(products.filter((p) => p.is_published).length), hint: `${products.length} total` },
    { label: "Klaim garansi", value: String(claims), hint: "Menunggu ditangani" },
  ];

  return (
    <>
      <PageHeader title={store.store_name} description="Ringkasan performa toko Anda." />
      {(needsStock > 0 || toDeliver > 0 || claims > 0) && (
        <Card className="mb-6 border-amber-500/40 bg-amber-500/5 py-4">
          <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <AlertTriangle className="size-4 text-amber-600" />
            {needsStock > 0 && <span>{needsStock} pesanan lunas menunggu stok</span>}
            {toDeliver > 0 && !tier.autoFulfillment && <span>{toDeliver} akun belum dikirim ke pembeli</span>}
            {claims > 0 && <span>{claims} klaim garansi baru</span>}
            <Link href={`/${storeId}/orders`} className="ml-auto font-medium underline underline-offset-4">
              Buka pesanan
            </Link>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="gap-2">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl">{s.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">{s.hint}</CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pesanan terbaru</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {orders.length === 0 && <p className="text-muted-foreground text-sm">Belum ada pesanan.</p>}
          {orders.slice(0, 8).map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-4 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{o.product_title}</div>
                <div className="text-muted-foreground text-xs">
                  {o.id} · {formatDate(o.created_at, true)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={o.payment_status === "PAID" ? "success" : o.payment_status === "FAILED" ? "destructive" : "warning"}>
                  {o.payment_status}
                </Badge>
                <span className="w-24 text-right">{formatIDR(o.amount)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
