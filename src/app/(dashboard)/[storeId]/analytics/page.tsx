import Link from "next/link";
import { Download } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { ordersSince, parseRange, RANGES, summarize } from "@/lib/data/analytics";
import { cn, formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RevenueChart } from "@/features/analytics/revenue-chart";

export const metadata = { title: "Analitik" };

export default async function AnalyticsPage({ params, searchParams }: { params: Promise<{ storeId: string }>; searchParams: Promise<{ days?: string }> }) {
  const { storeId } = await params;
  const days = parseRange((await searchParams).days);
  await requireStore(storeId);
  const s = summarize(await ordersSince(storeId, days), days);

  const stats = [
    { label: "Pendapatan", value: formatIDR(s.revenue), hint: `Bersih setelah fee ${formatIDR(s.net)}` },
    { label: "Pesanan lunas", value: String(s.paid), hint: `${s.created} checkout dibuat · ${s.failed} gagal/kedaluwarsa` },
    { label: "Konversi checkout", value: `${Math.round(s.conversion * 100)}%`, hint: "Lunas ÷ checkout dibuat" },
    { label: "Rata-rata pesanan", value: formatIDR(s.aov), hint: `${s.claims} pesanan pernah klaim garansi` },
  ];

  return (
    <>
      <PageHeader title="Analitik" description={`${days} hari terakhir`}>
        <div className="bg-muted inline-flex h-9 items-center rounded-lg p-[3px]">
          {RANGES.map((r) => (
            <Link key={r} href={`?days=${r}`} className={cn("rounded-md px-3 py-1 text-sm font-medium", r === days ? "bg-background shadow-sm" : "text-muted-foreground")}>
              {r} hari
            </Link>
          ))}
        </div>
        <Button variant="outline" asChild>
          <a href={`/${storeId}/analytics/export?days=${days}`}>
            <Download /> Ekspor CSV
          </a>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((x) => (
          <Card key={x.label} className="gap-2">
            <CardHeader>
              <CardDescription>{x.label}</CardDescription>
              <CardTitle className="text-2xl">{x.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">{x.hint}</CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pendapatan harian</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={s.daily} />
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produk terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada penjualan.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.topProducts.map((p) => (
                    <TableRow key={p.title}>
                      <TableCell className="max-w-56 truncate">{p.title}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">{formatIDR(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sumber referral</CardTitle>
            <CardDescription>Affiliate, Telegram dan Discord.</CardDescription>
          </CardHeader>
          <CardContent>
            {s.topReferrals.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada penjualan dari link ?ref.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral</TableHead>
                    <TableHead className="text-right">Pesanan</TableHead>
                    <TableHead className="text-right">Pendapatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.topReferrals.map((r) => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono text-xs">{r.code}</TableCell>
                      <TableCell className="text-right">{r.orders}</TableCell>
                      <TableCell className="text-right">{formatIDR(r.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
