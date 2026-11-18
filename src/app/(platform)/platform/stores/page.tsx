import { allStores } from "@/lib/data/platform-queries";
import { storefrontUrl } from "@/lib/store-url";
import { formatDate } from "@/lib/utils";
import { getCatalog } from "@/lib/catalog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SuspendButton } from "@/features/platform/store-row-actions";

export const metadata = { title: "Toko" };

export default async function PlatformStoresPage() {
  const { plans } = await getCatalog();
  const stores = await allStores();
  return (
    <>
      <PageHeader title="Semua toko" description={`${stores.length} toko`} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Toko</TableHead>
              <TableHead>Pemilik</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <a href={storefrontUrl(s)} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                    {s.store_name}
                  </a>
                  <div className="text-muted-foreground font-mono text-xs">{s.custom_domain ?? s.slug}</div>
                </TableCell>
                <TableCell className="text-xs">{s.owner?.email ?? "—"}</TableCell>
                <TableCell>{s.owner ? plans[s.owner.tier].name : "—"}</TableCell>
                <TableCell className="max-w-56 whitespace-normal">
                  {s.suspended ? <Badge variant="destructive">Suspended</Badge> : s.is_active ? <Badge variant="success">Aktif</Badge> : <Badge variant="secondary">Tutup</Badge>}
                  {s.suspended && s.suspended_reason && <div className="text-muted-foreground mt-1 text-xs">{s.suspended_reason}</div>}
                </TableCell>
                <TableCell>{formatDate(s.created_at)}</TableCell>
                <TableCell className="text-right">
                  <SuspendButton storeId={s.id} suspended={s.suspended} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
