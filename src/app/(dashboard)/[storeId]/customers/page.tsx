import Link from "next/link";
import { Download, Search, UserCheck } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { listCustomers } from "@/lib/data/queries";
import type { CustomerRow } from "@/lib/data/customers";
import { formatDate, formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { PayBadge } from "@/components/pay-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  searchParams: Promise<{ q?: string; c?: string }>;
}) {
  const { storeId } = await params;
  const { q = "", c } = await searchParams;
  await requireStore(storeId);
  const { orders, customers } = await listCustomers(storeId);

  const needle = q.trim().toLowerCase();
  const visible = needle
    ? customers.filter((r) => [r.name, r.email, r.phone].some((v) => v.toLowerCase().includes(needle)))
    : customers;
  const selected = c ? customers.find((r) => r.key === c) : undefined;
  const registered = customers.filter((r) => r.registered).length;
  const href = (key: string) => `?${new URLSearchParams({ ...(q ? { q } : {}), c: key })}#detail`;

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

      {selected && (
        <Card id="detail" className="mb-6 scroll-mt-4">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {selected.name || selected.email} <Registered row={selected} />
            </CardTitle>
            <p className="text-muted-foreground text-sm break-all">
              {selected.email} · {selected.phone || "—"}
            </p>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 [&>*]:min-w-0 [&>*]:break-words">
              <div>
                <div className="text-muted-foreground text-xs">Total belanja</div>
                <div className="font-semibold tabular-nums">{formatIDR(selected.total)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Pesanan lunas</div>
                <div className="font-semibold">
                  {selected.paid_orders} / {selected.orders}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Pertama beli</div>
                <div className="font-semibold">{formatDate(selected.first_order_at)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Klaim terbuka</div>
                <div className="font-semibold">{selected.open_claims}</div>
              </div>
            </div>
            <div className="divide-y rounded-md border">
              {orders
                .filter((o) => selected.order_ids.includes(o.id))
                .map((o) => (
                  <div key={o.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{o.product_title}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {o.id} · {formatDate(o.created_at, true)}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tabular-nums">{formatIDR(o.amount)}</span>
                      <PayBadge order={o} />
                    </div>
                  </div>
                ))}
            </div>
            <Link href={`/${storeId}/orders`} className="text-muted-foreground text-sm hover:underline">
              Kelola pesanan →
            </Link>
          </CardContent>
        </Card>
      )}

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">{q ? "Tidak ada yang cocok." : "Belum ada pembeli."}</p>
      ) : (
        <>
          {/* Phone: one card per buyer. */}
          <div className="grid gap-2 md:hidden">
            {visible.map((r) => (
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
                {visible.map((r) => (
                  <TableRow key={r.key} data-state={r.key === c ? "selected" : undefined}>
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
        </>
      )}
    </>
  );
}
