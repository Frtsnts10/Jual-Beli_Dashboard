import Link from "next/link";
import { Download, Search, UserCheck } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { listCustomers } from "@/lib/data/queries";
import type { CustomerRow } from "@/lib/data/customers";
import { formatDate, formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/pager";
import { paginate } from "@/lib/paging";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Pelanggan" };

function Registered({ row }: { row: CustomerRow }) {
  return row.registered ? (
    <Badge variant="success">
      <UserCheck /> Terdaftar
    </Badge>
  ) : (
    <Badge variant="secondary">Tamu</Badge>
  );
}

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ q?: string; page?: string; size?: string }>;
}) {
  const { storeId } = await params;
  const sp = await searchParams;
  const q = sp.q ?? "";
  await requireStore(storeId);
  const { customers } = await listCustomers(storeId);

  const needle = q.trim().toLowerCase();
  const visible = needle
    ? customers.filter((r) => [r.name, r.email, r.phone].some((v) => v.toLowerCase().includes(needle)))
    : customers;
  const registered = customers.filter((r) => r.registered).length;
  // Each buyer has their own page (/customers/u:<uid> or /customers/e:<email>).
  const href = (key: string) => `/${storeId}/customers/${encodeURIComponent(key)}`;
  const { rows, ...pager } = paginate(visible, sp, 10);

  return (
    <>
      <PageHeader title="Pelanggan" description={`${customers.length} pembeli · ${registered} punya akun di website toko`}>
        <Button variant="outline" asChild>
          <a href={`/${storeId}/customers/export`}>
            <Download /> Ekspor CSV
          </a>
        </Button>
      </PageHeader>

      <form className="relative mb-4 max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input name="q" defaultValue={q} placeholder="Cari nama, email atau WhatsApp" className="pl-9" />
      </form>

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">{q ? "Tidak ada yang cocok." : "Belum ada pembeli."}</p>
      ) : (
        <>
          {/* Phone: one card per buyer. */}
          <div className="grid gap-2 md:hidden">
            {rows.map((r) => (
              <Link key={r.key} href={href(r.key)} className="hover:bg-muted/50 rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.name || r.email}</div>
                    <div className="text-muted-foreground truncate text-xs">{r.name ? r.email : r.phone}</div>
                  </div>
                  <Registered row={r} />
                </div>
                <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-3 text-xs">
                  <span className="text-foreground font-medium tabular-nums">{formatIDR(r.total)}</span>
                  <span>{r.orders} pesanan</span>
                  <span>terakhir {formatDate(r.last_order_at)}</span>
                  {r.open_claims > 0 && <span className="text-destructive">{r.open_claims} klaim</span>}
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="hidden xl:table-cell">WhatsApp</TableHead>
                  <TableHead className="text-right">Pesanan</TableHead>
                  <TableHead className="text-right">Total belanja</TableHead>
                  <TableHead>Terakhir beli</TableHead>
                  <TableHead>Akun</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.key}>
                    <TableCell className="max-w-64">
                      <Link href={href(r.key)} className="block truncate font-medium hover:underline">
                        {r.name || r.email}
                      </Link>
                      <div className="text-muted-foreground truncate text-xs">
                        {r.name ? r.email : ""}
                        <span className="xl:hidden">{r.name ? " · " : ""}{r.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs xl:table-cell">{r.phone || "—"}</TableCell>
                    <TableCell className="text-right">
                      {r.orders}
                      {r.open_claims > 0 && <div className="text-destructive text-xs">{r.open_claims} klaim</div>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatIDR(r.total)}</TableCell>
                    <TableCell>{formatDate(r.last_order_at)}</TableCell>
                    <TableCell>
                      <Registered row={r} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager {...pager} className="mt-4" />
        </>
      )}
    </>
  );
}
