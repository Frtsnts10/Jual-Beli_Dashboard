import { adminDb } from "@/lib/firebase/admin";
import { requireStore } from "@/lib/auth";
import { mapSubscriptionPayment } from "@/lib/firestore-mappers";
import { formatDate, formatIDR } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanPicker } from "@/features/billing/plan-picker";

export const metadata = { title: "Langganan" };

export default async function BillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { storeId } = await params;
  const { paid } = await searchParams;
  const { user } = await requireStore(storeId);
  const payments = await adminDb.collection("subscription_payments").where("uid", "==", user.uid).get();
  const history = payments.docs
    .map(mapSubscriptionPayment)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);
  const justPaid = paid ? history.find((p) => p.id === paid) : undefined;

  return (
    <>
      <PageHeader
        title="Langganan"
        description={
          user.subscription_tier === "starter"
            ? "Anda di paket Starter (gratis)."
            : `Paket ${TIERS[user.subscription_tier].name} aktif sampai ${formatDate(user.subscription_expiry)}.`
        }
      />
      {justPaid && (
        <Card className="mb-6 py-4">
          <CardContent className="text-sm">
            {justPaid.status === "PAID"
              ? "Pembayaran diterima — paket Anda sudah aktif."
              : "Pembayaran sedang dikonfirmasi Xendit. Muat ulang halaman ini dalam beberapa saat."}
          </CardContent>
        </Card>
      )}
      <PlanPicker storeId={storeId} currentTier={user.subscription_tier} />
      {history.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Riwayat pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => {
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell>
                        {TIERS[row.tier].name} · {row.period === "yearly" ? "tahunan" : "bulanan"}
                      </TableCell>
                      <TableCell className="text-right">{formatIDR(row.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "PAID" ? "success" : row.status === "PENDING" ? "warning" : "secondary"}>{row.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(row.created_at, true)}</TableCell>
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
