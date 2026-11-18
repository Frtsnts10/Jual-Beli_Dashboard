import { allUsers } from "@/lib/data/platform-queries";
import { formatDate } from "@/lib/utils";
import { FEATURE_KEYS, getCatalog, type FeatureKey } from "@/lib/catalog";
import { OverridesDialog } from "@/features/platform/overrides-dialog";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlanEditor } from "@/features/platform/plan-editor";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Pengguna" };

export default async function PlatformUsersPage() {
  const { plans, templates } = await getCatalog();
  const users = await allUsers();
  return (
    <>
      <PageHeader title="Pengguna" description="Atur paket manual (komplimen, refund, pembayaran di luar QRIS platform) dan fitur khusus per seller. Semua perubahan tercatat di audit log." />
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
                <TableCell>{u.admin ? "—" : plans[u.tier].name}</TableCell>
                <TableCell>{u.admin || u.tier === "starter" ? "—" : formatDate(u.expiry)}</TableCell>
                <TableCell>{formatDate(u.created_at)}</TableCell>
                <TableCell>
                  {u.admin ? (
                    <span className="text-muted-foreground block text-right text-xs">Akun admin</span>
                  ) : (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <OverridesDialog
                        uid={u.uid}
                        email={u.email}
                        planName={plans[u.tier].name}
                        planFeatures={Object.fromEntries(FEATURE_KEYS.map((k) => [k, plans[u.tier][k]])) as Record<FeatureKey, boolean>}
                        overrides={u.overrides}
                        templates={templates.filter((t) => t.enabled).map((t) => ({ id: t.id, name: t.name, inPlan: plans[u.tier].templates.includes(t.id) }))}
                      />
                      <PlanEditor uid={u.uid} tier={u.tier} />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
