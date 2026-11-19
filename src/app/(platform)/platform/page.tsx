import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { platformActivity, platformOverview } from "@/lib/data/platform-queries";
import { getCatalog } from "@/lib/catalog";
import { RevenueChart } from "@/features/analytics/revenue-chart";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPlatformQris } from "@/lib/data/platform-settings";
import { formatDate, formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: { absolute: "Ringkasan · Jual Admin" } };

export default async function PlatformOverviewPage() {
  const [o, activity, plans, qris, proofs, deletions] = await Promise.all([
    platformOverview(),
    platformActivity(),
    getCatalog(),
    getPlatformQris(),
    adminDb.collection("subscription_payments").where("status", "==", "PENDING").get(),
    adminDb.collection("account_deletion_requests").where("status", "==", "PENDING").count().get(),
  ]);
  // Only whether a setting exists — values never reach the page.
  const has = (k: string) => !!process.env[k];
  const checks: { ok: boolean; label: string; fix: string; href?: string }[] = [
    { ok: !!qris, label: "QRIS platform", fix: "Unggah QRIS agar seller bisa membeli/upgrade paket.", href: "/platform/payments" },
    { ok: has("N8N_WEBHOOK_URL") && has("N8N_WEBHOOK_SECRET"), label: "Otomasi WhatsApp (n8n)", fix: "Isi N8N_WEBHOOK_URL dan N8N_WEBHOOK_SECRET di env Vercel." },
    { ok: has("CRON_SECRET"), label: "Cron harian", fix: "Isi CRON_SECRET di env Vercel (pengingat H-3, kedaluwarsa pesanan)." },
    { ok: has("VAULT_ENCRYPTION_KEY"), label: "Enkripsi brankas", fix: "Isi VAULT_ENCRYPTION_KEY di env Vercel." },
    {
      // Referenced directly: NEXT_PUBLIC_* values are inlined at build time.
      ok: !!process.env.NEXT_PUBLIC_ROOT_DOMAIN,
      label: "Domain platform (subdomain toko)",
      fix: "Isi NEXT_PUBLIC_ROOT_DOMAIN (mis. belidi.biz.id) di env Vercel dashboard dan etalase, lalu redeploy — tiap toko jadi namatoko.<domain>.",
    },
    { ok: has("ANTHROPIC_API_KEY"), label: "Tema AI (Claude)", fix: "Isi ANTHROPIC_API_KEY di env Vercel dashboard agar seller bisa memakai Tema AI (nyalakan di menu Tema).", href: "/platform/themes" },
    {
      ok: has("VERCEL_TOKEN") && has("VERCEL_STOREFRONT_PROJECT_ID"),
      label: "Domain sendiri seller otomatis",
      fix: "Isi VERCEL_TOKEN dan VERCEL_STOREFRONT_PROJECT_ID (+ VERCEL_TEAM_ID untuk project team) agar domain seller dipasang ke Vercel otomatis.",
    },
  ];
  const todo = [
    { n: proofs.docs.filter((d) => d.get("proof_uploaded_at")).length, label: "bukti bayar paket menunggu konfirmasi", href: "/platform/payments" },
    { n: deletions.data().count, label: "pengajuan hapus akun", href: "/platform/deletions" },
  ].filter((t) => t.n > 0);
  const stats = [
    { label: "GMV bulan ini", value: formatIDR(o.gmv), hint: `${o.ordersPaid} pesanan lunas, dibayar langsung ke QRIS seller` },
    { label: "Pendapatan langganan bulan ini", value: formatIDR(o.subscriptionRevenue), hint: "Pro & Ultimate" },
    { label: "Toko", value: String(o.stores), hint: `${o.users} pengguna` },
    {
      label: "Paket aktif",
      value: plans.planKeys
        .filter((k) => k !== "starter")
        .map((k) => `${o.tiers[k] ?? 0} ${plans.plans[k].name}`)
        .join(" · "),
      hint: `${o.tiers.starter ?? 0} ${plans.plans.starter.name}`,
    },
  ];
  return (
    <>
      <PageHeader title="Ringkasan platform" description="Kondisi seluruh platform bulan ini." />
      {todo.length > 0 && (
        <Card className="mb-6 border-amber-300 py-4 dark:border-amber-800">
          <CardContent className="grid gap-1 text-sm">
            {todo.map((t) => (
              <Link key={t.href} href={t.href} className="font-medium hover:underline">
                {t.n} {t.label} →
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Setup platform</CardTitle>
          <CardDescription>{checks.every((c) => c.ok) ? "Semua siap." : "Lengkapi yang bertanda merah."}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {checks.map((c) => (
            <div key={c.label} className="flex items-start gap-2">
              {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" />}
              <div className="min-w-0">
                <div className="font-medium">{c.label}</div>
                {!c.ok &&
                  (c.href ? (
                    <Link href={c.href} className="text-muted-foreground text-xs underline underline-offset-4">
                      {c.fix}
                    </Link>
                  ) : (
                    <div className="text-muted-foreground text-xs">{c.fix}</div>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="mt-6 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>GMV harian</CardTitle>
            <CardDescription>
              30 hari terakhir · {formatIDR(activity.daily.reduce((s, d) => s + d.gmv, 0))} dari pesanan lunas semua toko
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={activity.daily.map((d) => ({ day: d.day, value: d.gmv }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan langganan harian</CardTitle>
            <CardDescription>30 hari terakhir · {formatIDR(activity.daily.reduce((s, d) => s + d.plans, 0))} dari pembayaran paket</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={activity.daily.map((d) => ({ day: d.day, value: d.plans }))} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle>Toko teratas</CardTitle>
            <CardDescription>Berdasarkan GMV 30 hari terakhir.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.topStores.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada pesanan lunas.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Toko</TableHead>
                    <TableHead className="text-right">Pesanan</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.topStores.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="max-w-48 truncate font-medium">{s.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.orders}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatIDR(s.gmv)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div className="grid gap-1.5">
              <CardTitle>Pembayaran paket terbaru</CardTitle>
              <CardDescription>8 transaksi terakhir.</CardDescription>
            </div>
            <Link href="/platform/payments" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
              Lihat semua
            </Link>
          </CardHeader>
          <CardContent>
            {activity.recentPayments.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada pembayaran paket.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activity.recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-44">
                        <div className="truncate text-xs">{p.email || p.uid}</div>
                        <div className="text-muted-foreground text-xs">{formatDate(p.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        {plans.plans[p.tier]?.name ?? p.tier} · {p.period === "yearly" ? "tahunan" : "bulanan"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatIDR(p.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS[p.status].variant}>{p.status === "PENDING" && p.proof_uploaded_at ? "Cek bukti" : STATUS[p.status].label}</Badge>
                      </TableCell>
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

const STATUS = {
  PAID: { label: "Lunas", variant: "success" },
  PENDING: { label: "Menunggu", variant: "secondary" },
  EXPIRED: { label: "Kedaluwarsa", variant: "outline" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
} as const;
