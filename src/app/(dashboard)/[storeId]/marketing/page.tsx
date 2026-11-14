import { Lock } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { adminDb } from "@/lib/firebase/admin";
import { toISO } from "@/lib/data/mappers";
import { listProducts } from "@/lib/data/queries";
import { storefrontUrl } from "@/lib/store-url";
import { formatDate, formatIDR } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AffiliateLinkBuilder } from "@/features/marketing/affiliate-link";
import { BroadcastForm } from "@/features/marketing/broadcast-form";

export const metadata = { title: "Marketing" };

export default async function MarketingPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { store, tier } = await requireStore(storeId);

  if (!TIERS[tier].marketing) {
    return (
      <>
        <PageHeader title="Marketing" description="Growth engine paket Ultimate." />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" /> Fitur paket Ultimate
            </CardTitle>
            <CardDescription>
              WhatsApp broadcast ke pelanggan lama, flash sale dengan timer, dan laporan affiliate/referral. Upgrade di halaman Langganan.
            </CardDescription>
          </CardHeader>
        </Card>
      </>
    );
  }

  const [orders, products, broadcasts] = await Promise.all([
    adminDb.collection("orders").where("store_id", "==", storeId).where("payment_status", "==", "PAID").select("referral_code", "amount", "paid_at").get(),
    listProducts(storeId),
    adminDb.collection("broadcasts").where("store_id", "==", storeId).orderBy("created_at", "desc").limit(10).get(),
  ]);

  const affiliates = new Map<string, { orders: number; revenue: number; last: string }>();
  for (const o of orders.docs) {
    const code = o.get("referral_code") as string | null;
    if (!code) continue;
    const row = affiliates.get(code) ?? { orders: 0, revenue: 0, last: "" };
    row.orders++;
    row.revenue += o.get("amount") ?? 0;
    const paid = toISO(o.get("paid_at")) ?? "";
    if (paid > row.last) row.last = paid;
    affiliates.set(code, row);
  }
  const affiliateRows = [...affiliates].sort((a, b) => b[1].revenue - a[1].revenue);

  return (
    <>
      <PageHeader title="Marketing" description="Broadcast, affiliate dan flash sale." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp broadcast</CardTitle>
            <CardDescription>Kirim promo upsell/cross-sell ke pembeli lama lewat n8n.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <BroadcastForm storeId={storeId} products={products.map((p) => ({ id: p.id, title: p.title }))} />
            {broadcasts.size > 0 && (
              <div className="grid gap-2 text-sm">
                <div className="font-medium">Riwayat</div>
                {broadcasts.docs.map((b) => (
                  <div key={b.id} className="flex items-start justify-between gap-4 border-t pt-2">
                    <p className="text-muted-foreground line-clamp-2">{b.get("message")}</p>
                    <div className="shrink-0 text-right text-xs">
                      <Badge variant={b.get("status") === "SENT" ? "success" : "destructive"}>{b.get("recipients")} penerima</Badge>
                      <div className="text-muted-foreground mt-1">{formatDate(toISO(b.get("created_at")), true)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Affiliate / referral</CardTitle>
            <CardDescription>Bagikan link ber-?ref ke reseller. Setiap pesanan lunas tercatat atas namanya.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <AffiliateLinkBuilder baseUrl={storefrontUrl(store)} />
            {affiliateRows.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada pesanan dari link affiliate.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral</TableHead>
                    <TableHead className="text-right">Pesanan</TableHead>
                    <TableHead className="text-right">Omzet</TableHead>
                    <TableHead>Terakhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliateRows.map(([code, row]) => (
                    <TableRow key={code}>
                      <TableCell className="font-mono text-xs">{code}</TableCell>
                      <TableCell className="text-right">{row.orders}</TableCell>
                      <TableCell className="text-right">{formatIDR(row.revenue)}</TableCell>
                      <TableCell>{formatDate(row.last)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Flash sale</CardTitle>
            <CardDescription>
              Atur harga coret + timer di menu Produk (aktifkan “Flash sale”, isi harga promo dan waktu berakhir). Etalase menampilkan hitung mundur dan
              checkout memakai harga promo sampai timer habis.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
