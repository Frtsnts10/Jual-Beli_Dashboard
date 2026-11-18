import { subscriptionPaymentsForReview } from "@/lib/data/platform-queries";
import { getPlatformQris } from "@/lib/data/platform-settings";
import { formatDate, formatIDR } from "@/lib/utils";
import { getCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrisCard } from "@/features/payments/qris-card";
import { removePlatformQris, savePlatformQris } from "@/features/platform/actions";
import { SubscriptionReview } from "@/features/platform/subscription-review";

export const metadata = { title: "Pembayaran paket" };

export default async function PlatformPaymentsPage() {
  const { plans } = await getCatalog();
  const [qris, { pending, recent }] = await Promise.all([getPlatformQris(), subscriptionPaymentsForReview()]);
  const plan = (p: (typeof pending)[number]) => `${plans[p.tier].name} ${p.period === "yearly" ? "tahunan" : "bulanan"}`;

  return (
    <>
      <PageHeader title="Pembayaran paket" description="Seller membayar paket ke QRIS platform dan mengunggah bukti; aktifkan paket setelah dana masuk." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,24rem)_1fr] [&>*]:min-w-0">
        <QrisCard
          payment={qris}
          save={savePlatformQris}
          remove={removePlatformQris}
          title="QRIS platform"
          description="QRIS milik platform untuk pembelian paket Pro/Ultimate. Nominal + kode unik terisi otomatis di halaman Langganan seller."
          missing="Belum ada QRIS platform — seller belum bisa membeli paket."
        />
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Menunggu konfirmasi ({pending.filter((p) => p.proof_uploaded_at).length})</CardTitle>
            <CardDescription>{pending.length ? `${pending.length} pembelian belum selesai` : "Tidak ada pembelian yang menunggu."}</CardDescription>
          </CardHeader>
          {pending.length > 0 && (
            <CardContent className="grid gap-2">
              {pending.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium break-all">{p.email}</div>
                    <div className="text-muted-foreground text-xs">
                      {plan(p)} · <span className="font-mono">{p.id}</span> · {formatDate(p.created_at, true)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold tabular-nums">{formatIDR(p.amount)}</span>
                    <SubscriptionReview
                      p={{ id: p.id, email: p.email, plan: plan(p), amount: p.amount, uniqueCode: p.unique_code, proofAt: p.proof_uploaded_at, payBy: p.pay_by }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>
      {recent.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Riwayat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1 text-sm">
            {recent.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2 last:border-0">
                <span className="min-w-0 break-all">
                  {p.email} · {plan(p)}
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{formatIDR(p.amount)}</span>
                  <Badge variant={p.status === "PAID" ? "success" : p.status === "REJECTED" ? "destructive" : "secondary"} title={p.rejected_reason ?? undefined}>
                    {p.status === "PAID" ? "Lunas" : p.status === "REJECTED" ? "Ditolak" : "Batal"}
                  </Badge>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
