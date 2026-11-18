import { allUsers } from "@/lib/data/platform-queries";
import { formatDate } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanEditor } from "@/features/platform/plan-editor";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Pengguna" };

export default async function PlatformUsersPage() {
  const users = await allUsers();
  return (
    <>
      <PageHeader title="Pengguna" description="Atur paket manual (komplimen, refund, pembayaran di luar QRIS platform). Semua perubahan tercatat di audit log." />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead className="text-right">Toko</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Berakhir</TableHead>
              <TableHead>Daftar</TableHead>
              <TableHead className="text-right">Ubah paket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.uid}>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium">
                    {u.name || "—"}
                    {u.admin && <Badge>Admin</Badge>}
                  </div>
                  <div className="text-muted-foreground text-xs">{u.email}</div>
                </TableCell>
                <TableCell className="text-right">{u.stores}</TableCell>
                <TableCell>{u.admin ? "—" : TIERS[u.tier].name}</TableCell>
                <TableCell>{u.admin || u.tier === "starter" ? "—" : formatDate(u.expiry)}</TableCell>
                <TableCell>{formatDate(u.created_at)}</TableCell>
                <TableCell>
                  {u.admin ? <span className="text-muted-foreground block text-right text-xs">Akun admin</span> : <PlanEditor uid={u.uid} tier={u.tier} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
