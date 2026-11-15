import { platformOverview } from "@/lib/data/platform-queries";
import { formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ringkasan" };

export default async function PlatformOverviewPage() {
  const o = await platformOverview();
  const stats = [
    { label: "GMV bulan ini", value: formatIDR(o.gmv), hint: `${o.ordersPaid} pesanan lunas, dibayar langsung ke QRIS seller` },
    { label: "Pendapatan langganan bulan ini", value: formatIDR(o.subscriptionRevenue), hint: "Pro & Ultimate" },
    { label: "Toko", value: String(o.stores), hint: `${o.users} pengguna` },
    { label: "Paket aktif", value: `${o.tiers.pro} Pro · ${o.tiers.ultimate} Ultimate`, hint: `${o.tiers.starter} Starter` },
  ];
  return (
    <>
      <PageHeader title="Ringkasan platform" description="Kondisi seluruh platform bulan ini." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}
