import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Star, UserCheck } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { listCustomers, listReviews } from "@/lib/data/queries";
import { waNumber } from "@/lib/integrations/whatsapp";
import { paginate } from "@/lib/paging";
import { formatDate, formatIDR } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { PayBadge } from "@/components/pay-badge";
import { Pager } from "@/components/pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Detail pelanggan" };

/** One buyer of this store: contact, totals, every order, warranty claims and reviews. */
export default async function CustomerPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string; key: string }>;
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const { storeId, key: rawKey } = await params;
  const key = decodeURIComponent(rawKey);
  await requireStore(storeId);
  const [{ orders, customers }, reviews] = await Promise.all([listCustomers(storeId), listReviews(storeId)]);
  const c = customers.find((r) => r.key === key);
  if (!c) notFound();

  const mine = orders.filter((o) => c.order_ids.includes(o.id));
  const claims = mine.filter((o) => o.warranty_status === "CLAIMED");
  const myReviews = reviews.filter((r) => c.order_ids.includes(r.id));
  const { rows, ...pager } = paginate(mine, await searchParams, 10);
  const stats = [
    { label: "Total belanja", value: formatIDR(c.total) },
    { label: "Pesanan lunas", value: `${c.paid_orders} / ${c.orders}` },
    { label: "Pertama beli", value: formatDate(c.first_order_at) },
    { label: "Terakhir beli", value: formatDate(c.last_order_at) },
  ];

  return (
    <>
      <Link href={`/${storeId}/customers`} className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
        <ArrowLeft className="size-4" /> Pelanggan
      </Link>
      <PageHeader title={c.name || c.email} description={`${c.email}${c.phone ? ` · ${c.phone}` : ""}`}>
        {c.registered ? (
          <Badge variant="success">
            <UserCheck /> Terdaftar
          </Badge>
        ) : (
          <Badge variant="secondary">Tamu</Badge>
        )}
        {c.phone && (
          <Button variant="outline" asChild>
            <a href={`https://wa.me/${waNumber(c.phone)}`} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Chat WhatsApp
            </a>
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardHeader className="px-4">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-lg tabular-nums">{s.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] [&>*]:min-w-0">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Pesanan</CardTitle>
            <CardDescription>{mine.length} pesanan di toko ini</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="divide-y rounded-md border">
              {rows.map((o) => (
                <div key={o.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.product_title}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {o.id} · {formatDate(o.created_at, true)}
                    </div>
                    {o.access_expires_at && <div className="text-muted-foreground text-xs">Aktif s/d {formatDate(o.access_expires_at)}</div>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tabular-nums">{formatIDR(o.amount)}</span>
                    <PayBadge order={o} />
                  </div>
                </div>
              ))}
            </div>
            <Pager {...pager} />
          </CardContent>
        </Card>

        <div className="grid h-fit gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Klaim garansi</CardTitle>
              <CardDescription>{claims.length ? `${claims.length} menunggu ditangani` : "Tidak ada klaim terbuka."}</CardDescription>
            </CardHeader>
            {claims.length > 0 && (
              <CardContent className="grid gap-2 text-sm">
                {claims.map((o) => (
                  <Link key={o.id} href={`/${storeId}/orders`} className="hover:bg-muted/50 rounded-md border p-3">
                    <div className="font-medium">{o.product_title}</div>
                    <div className="text-muted-foreground text-xs">“{o.warranty_claim?.reason}”</div>
                  </Link>
                ))}
              </CardContent>
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ulasan</CardTitle>
              <CardDescription>{myReviews.length ? `${myReviews.length} ulasan` : "Belum menulis ulasan."}</CardDescription>
            </CardHeader>
            {myReviews.length > 0 && (
              <CardContent className="grid gap-2 text-sm">
                {myReviews.map((r) => (
                  <div key={r.id} className="rounded-md border p-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={n <= r.rating ? "size-3.5 fill-amber-400 text-amber-400" : "text-muted-foreground/40 size-3.5"} />
                      ))}
                      {r.hidden && <Badge variant="secondary">Disembunyikan</Badge>}
                    </div>
                    {r.text && <p className="text-muted-foreground mt-1 text-xs">{r.text}</p>}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
