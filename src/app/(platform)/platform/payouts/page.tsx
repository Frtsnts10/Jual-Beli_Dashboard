import { owedPayouts } from "@/lib/data/platform-queries";
import { formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayoutButton } from "@/features/platform/payout-button";

export const metadata = { title: "Pencairan" };

export default async function PlatformPayoutsPage() {
  const rows = await owedPayouts();
  return (
    <>
      <PageHeader
        title="Pencairan ke seller"
        description="Pembayaran yang ditampung platform karena toko belum punya akun Xendit LIVE. Transfer saldo bersih ke seller, lalu catat di sini."
      />
      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">Tidak ada saldo yang harus dicairkan.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Toko</TableHead>
                <TableHead className="text-right">Pesanan</TableHead>
                <TableHead className="text-right">Kotor</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Dicairkan</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.storeId}>
                  <TableCell className="font-medium">{r.storeName}</TableCell>
                  <TableCell className="text-right">{r.orderIds.length}</TableCell>
                  <TableCell className="text-right">{formatIDR(r.gross)}</TableCell>
                  <TableCell className="text-right">{formatIDR(r.fees)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatIDR(r.gross - r.fees)}</TableCell>
                  <TableCell className="text-right">
                    <PayoutButton storeId={r.storeId} orderIds={r.orderIds} net={r.gross - r.fees} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
