import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { platformOverview } from "@/lib/data/platform-queries";
import { getPlatformQris } from "@/lib/data/platform-settings";
import { formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ringkasan" };

export default async function PlatformOverviewPage() {
  const [o, qris, proofs, deletions] = await Promise.all([
    platformOverview(),
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
  ];
  const todo = [
    { n: proofs.docs.filter((d) => d.get("proof_uploaded_at")).length, label: "bukti bayar paket menunggu konfirmasi", href: "/platform/payments" },
    { n: deletions.data().count, label: "pengajuan hapus akun", href: "/platform/deletions" },
  ].filter((t) => t.n > 0);
  const stats = [
    { label: "GMV bulan ini", value: formatIDR(o.gmv), hint: `${o.ordersPaid} pesanan lunas, dibayar langsung ke QRIS seller` },
    { label: "Pendapatan langganan bulan ini", value: formatIDR(o.subscriptionRevenue), hint: "Pro & Ultimate" },
    { label: "Toko", value: String(o.stores), hint: `${o.users} pengguna` },
    { label: "Paket aktif", value: `${o.tiers.pro} Pro · ${o.tiers.ultimate} Ultimate`, hint: `${o.tiers.starter} Starter` },
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
