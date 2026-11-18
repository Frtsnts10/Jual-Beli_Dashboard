import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/access/auth";
import { mapSubscriptionPayment } from "@/lib/data/mappers";
import { formatDate, formatIDR } from "@/lib/utils";
import { getCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QRCode from "qrcode";
import { PlanPicker } from "@/features/billing/plan-picker";
import { SubscriptionProof } from "@/features/billing/subscription-pay";
import { getPlatformQris } from "@/lib/data/platform-settings";
import { expireSubscriptionPayments } from "@/lib/payments/subscriptions";
import { qrisWithAmount } from "@/lib/qris";
import type { SubscriptionPayment } from "@/types/schema";

const STATUS: Record<SubscriptionPayment["status"], [string, "success" | "warning" | "secondary" | "destructive"]> = {
  PAID: ["Lunas", "success"],
  PENDING: ["Menunggu", "warning"],
  EXPIRED: ["Batal", "secondary"],
  REJECTED: ["Ditolak", "destructive"],
};

export const metadata = { title: "Langganan" };

export default async function BillingPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { user } = await requireStore(storeId, { ownerOnly: true });
  const catalog = await getCatalog();
  await expireSubscriptionPayments(user.uid);
  const [payments, platformQris] = await Promise.all([adminDb.collection("subscription_payments").where("uid", "==", user.uid).get(), getPlatformQris()]);
  const history = payments.docs
    .map(mapSubscriptionPayment)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);
  // The purchase in progress (newest pending), shown with the platform QRIS for its exact amount.
  const open = history.find((p) => p.status === "PENDING");
  const qrSvg =
    open && platformQris ? await QRCode.toString(qrisWithAmount(platformQris.qris_payload, open.amount), { type: "svg", margin: 1, errorCorrectionLevel: "M" }) : null;
  const lastRejected = history[0]?.status === "REJECTED" ? history[0] : undefined;

  return (
    <>
      <PageHeader
        title="Langganan"
        description={
          user.subscription_tier === "starter"
            ? "Anda di paket Starter (gratis)."
            : `Paket ${catalog.plans[user.subscription_tier].name} aktif sampai ${formatDate(user.subscription_expiry)}.`
        }
      />
      {open && (
        <Card id="bayar" className="mb-6 scroll-mt-4">
          <CardHeader>
            <CardTitle>
              Bayar paket {catalog.plans[open.tier].name} {open.period === "yearly" ? "tahunan" : "bulanan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[14rem_1fr] md:items-start">
            {open.proof_uploaded_at ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 md:col-span-2 dark:bg-amber-950/30 dark:text-amber-200">
                Bukti terkirim {formatDate(open.proof_uploaded_at, true)}. Admin platform sedang mengecek pembayaran {formatIDR(open.amount)} — paket aktif
                otomatis setelah dikonfirmasi.
              </div>
            ) : qrSvg ? (
              <div
                className="mx-auto w-full max-w-56 rounded-xl border bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
                role="img"
                aria-label={`QRIS ${formatIDR(open.amount)}`}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <p className="text-muted-foreground text-sm">QRIS platform sedang diperbarui. Coba lagi nanti.</p>
            )}
            <div className="grid gap-3 text-sm">
              {!open.proof_uploaded_at && (
                <>
                  <div>
                    <div className="text-muted-foreground">Bayar tepat ke {platformQris?.merchant_name || "QRIS platform"}</div>
                    <div className="text-2xl font-bold tabular-nums">{formatIDR(open.amount)}</div>
                    <div className="text-muted-foreground text-xs">
                      Termasuk kode unik {open.unique_code}. Bayar sebelum {formatDate(open.pay_by, true)}.
                    </div>
                  </div>
                  <ol className="text-muted-foreground list-inside list-decimal">
                    <li>Scan QR dengan e-wallet / m-banking — nominal sudah terisi.</li>
                    <li>Screenshot bukti berhasil, lalu unggah di bawah.</li>
                    <li>Paket aktif setelah admin mengonfirmasi.</li>
                  </ol>
                </>
              )}
              <SubscriptionProof storeId={storeId} paymentId={open.id} hasProof={!!open.proof_uploaded_at} />
            </div>
          </CardContent>
        </Card>
      )}
      {!open && lastRejected && (
        <Card className="mb-6 py-4">
          <CardContent className="text-destructive text-sm">
            Pembayaran {lastRejected.id} ditolak admin{lastRejected.rejected_reason ? `: ${lastRejected.rejected_reason}` : ""}. Pilih paket lagi untuk mengulang.
          </CardContent>
        </Card>
      )}
      {!platformQris && (
        <Card className="mb-6 border-amber-300 py-4 dark:border-amber-800">
          <CardContent className="text-sm text-amber-900 dark:text-amber-200">
            Pembelian paket sedang ditutup sementara — admin platform belum memasang QRIS pembayaran. Paket Anda saat ini tetap berjalan seperti biasa.
          </CardContent>
        </Card>
      )}
      <PlanPicker storeId={storeId} currentTier={user.subscription_tier} expiry={user.subscription_expiry} canBuy={!!platformQris} plans={catalog.plans} />
      {history.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Riwayat pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">ID</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => {
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="hidden font-mono text-xs sm:table-cell">{row.id}</TableCell>
                      <TableCell className="whitespace-normal">
                        {catalog.plans[row.tier].name} · {row.period === "yearly" ? "tahunan" : "bulanan"}
                      </TableCell>
                      <TableCell className="text-right">{formatIDR(row.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS[row.status][1]}>{STATUS[row.status][0]}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(row.created_at, true)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
