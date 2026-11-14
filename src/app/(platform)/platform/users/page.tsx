import { allUsers } from "@/lib/data/platform-queries";
import { formatDate } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanEditor } from "@/features/platform/plan-editor";

export const metadata = { title: "Pengguna" };

export default async function PlatformUsersPage() {
  const users = await allUsers();
  return (
    <>
      <PageHeader title="Pengguna" description="Atur paket manual (komplimen, refund, pembayaran di luar Xendit). Semua perubahan tercatat di audit log." />
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
                  <div className="font-medium">{u.name || "—"}</div>
                  <div className="text-muted-foreground text-xs">{u.email}</div>
                </TableCell>
                <TableCell className="text-right">{u.stores}</TableCell>
                <TableCell>{TIERS[u.tier].name}</TableCell>
                <TableCell>{u.tier === "starter" ? "—" : formatDate(u.expiry)}</TableCell>
                <TableCell>{formatDate(u.created_at)}</TableCell>
                <TableCell>
                  <PlanEditor uid={u.uid} tier={u.tier} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
