import { accountDeletionRequests } from "@/lib/data/platform-queries";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeletionReview } from "@/features/platform/deletion-review";

export const metadata = { title: "Hapus akun" };

export default async function DeletionRequestsPage() {
  const requests = await accountDeletionRequests();
  return (
    <>
      <PageHeader
        title="Hapus akun"
        description="Pembeli mengajukan dari halaman Akun → Keamanan di website toko; penjual dari menu akun di dashboard. Proses dalam 7 hari: setujui untuk menghapus, atau tolak dengan alasan."
      />
      <Card>
        <CardHeader>
          <CardTitle>Menunggu ({requests.length})</CardTitle>
          <CardDescription>{requests.length ? "Urut dari pengajuan terlama." : "Tidak ada pengajuan."}</CardDescription>
        </CardHeader>
        {requests.length > 0 && (
          <CardContent className="grid gap-2">
            {requests.map((r) => (
              <div key={r.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium break-all">{r.name || r.email}</span>
                    {r.kind === "seller" ? (
                      <Badge variant="destructive">Akun penjual · {r.stores} toko</Badge>
                    ) : (
                      r.isSeller && <Badge variant="warning">Juga akun penjual</Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs break-all">
                    {r.email} · {r.orders} pesanan{r.store ? ` · dari ${r.store}` : ""} · {formatDate(r.requested_at, true)}
                  </div>
                  {r.reason && <p className="text-muted-foreground mt-1 text-xs">“{r.reason}”</p>}
                </div>
                <DeletionReview r={{ uid: r.uid, email: r.email, orders: r.orders, isSeller: r.isSeller, kind: r.kind, stores: r.stores }} />
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </>
  );
}
