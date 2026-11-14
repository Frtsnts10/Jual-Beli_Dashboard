import { Lock } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { adminDb } from "@/lib/firebase/admin";
import { toISO } from "@/lib/data/mappers";
import { listProducts } from "@/lib/data/queries";
import { describeVoucher, type Voucher } from "@/lib/voucher";
import { formatDate, formatIDR } from "@/lib/utils";
import { TIERS } from "@/config/tiers";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VoucherActions, VoucherForm } from "@/features/vouchers/voucher-form";

export const metadata = { title: "Voucher" };

type Row = Voucher & { id: string; paid: number; discountTotal: number; revenue: number };

function status(v: Row): [string, "success" | "secondary" | "warning" | "destructive"] {
  if (!v.active) return ["Nonaktif", "secondary"];
  if (v.expires_at && new Date(v.expires_at) <= new Date()) return ["Kedaluwarsa", "destructive"];
  if (v.max_uses !== null && v.used_count >= v.max_uses) return ["Kuota habis", "warning"];
  return ["Aktif", "success"];
}

export default async function VouchersPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const { tier } = await requireStore(storeId);

  if (!TIERS[tier].vouchers) {
    return (
      <>
        <PageHeader title="Voucher" description="Kode promo untuk pembeli." />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4" /> Fitur paket Pro & Ultimate
            </CardTitle>
            <CardDescription>Buat kode diskon persen atau nominal, dengan kuota, minimal belanja dan tanggal berakhir. Upgrade di halaman Langganan.</CardDescription>
          </CardHeader>
        </Card>
      </>
    );
  }

  const [snap, products, paid] = await Promise.all([
    adminDb.collection("vouchers").where("store_id", "==", storeId).orderBy("created_at", "desc").limit(200).get(),
    listProducts(storeId),
    adminDb.collection("orders").where("store_id", "==", storeId).where("payment_status", "==", "PAID").select("voucher_code", "discount", "amount").get(),
  ]);
  const stats = new Map<string, { paid: number; discount: number; revenue: number }>();
  for (const o of paid.docs) {
    const code = o.get("voucher_code") as string | undefined;
    if (!code) continue;
    const s = stats.get(code) ?? { paid: 0, discount: 0, revenue: 0 };
    s.paid++;
    s.discount += o.get("discount") ?? 0;
    s.revenue += o.get("amount") ?? 0;
    stats.set(code, s);
  }
  const titles = new Map(products.map((p) => [p.id, p.title]));
  const rows: Row[] = snap.docs.map((d) => {
    const s = stats.get(d.get("code")) ?? { paid: 0, discount: 0, revenue: 0 };
    return {
      id: d.id,
      store_id: d.get("store_id"),
      code: d.get("code"),
      type: d.get("type"),
      value: d.get("value"),
      max_discount: d.get("max_discount") ?? null,
      min_amount: d.get("min_amount") ?? 0,
      max_uses: d.get("max_uses") ?? null,
      used_count: d.get("used_count") ?? 0,
      expires_at: toISO(d.get("expires_at")),
      product_ids: d.get("product_ids") ?? null,
      active: d.get("active") ?? true,
      paid: s.paid,
      discountTotal: s.discount,
      revenue: s.revenue,
    };
  });
  const scope = (v: Row) => (v.product_ids ? v.product_ids.map((id) => titles.get(id) ?? "Produk dihapus").join(", ") : "Semua produk");
  const rules = (v: Row) =>
    [v.min_amount ? `min. ${formatIDR(v.min_amount)}` : null, v.expires_at ? `s/d ${formatDate(v.expires_at)}` : null].filter(Boolean).join(" · ") || "Tanpa syarat";

  return (
    <>
      <PageHeader title="Voucher" description="Pembeli memasukkan kode di halaman checkout; harga dipotong sebelum bayar." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,26rem)_1fr] [&>*]:min-w-0">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Buat voucher</CardTitle>
            <CardDescription>Kuota terpakai saat checkout dan dikembalikan bila tagihan kedaluwarsa.</CardDescription>
          </CardHeader>
          <CardContent>
            <VoucherForm storeId={storeId} products={products.map((p) => ({ id: p.id, title: p.title }))} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Daftar voucher</CardTitle>
            <CardDescription>{rows.length ? `${rows.length} voucher` : "Belum ada voucher."}</CardDescription>
          </CardHeader>
          {rows.length > 0 && (
            <CardContent>
              {/* Phone: cards */}
              <div className="grid gap-2 md:hidden">
                {rows.map((v) => {
                  const [label, variant] = status(v);
                  return (
                    <div key={v.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-mono font-semibold">{v.code}</div>
                          <div className="text-muted-foreground text-xs">
                            {describeVoucher(v)} · {scope(v)}
                          </div>
                        </div>
                        <VoucherActions storeId={storeId} code={v.code} active={v.active} used={v.used_count} />
                      </div>
                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <Badge variant={variant}>{label}</Badge>
                        <span>
                          Dipakai {v.used_count}
                          {v.max_uses !== null && ` / ${v.max_uses}`}
                        </span>
                        <span>{rules(v)}</span>
                        {v.paid > 0 && <span className="text-foreground">{v.paid} lunas · {formatIDR(v.revenue)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Tablet+: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Syarat</TableHead>
                      <TableHead className="text-right">Dipakai</TableHead>
                      <TableHead className="text-right">Omzet lunas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((v) => {
                      const [label, variant] = status(v);
                      return (
                        <TableRow key={v.id}>
                          <TableCell className="max-w-56">
                            <div className="font-mono font-semibold">{v.code}</div>
                            <div className="text-muted-foreground truncate text-xs">
                              {describeVoucher(v)} · {scope(v)}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs whitespace-normal">{rules(v)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {v.used_count}
                            {v.max_uses !== null && <span className="text-muted-foreground"> / {v.max_uses}</span>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatIDR(v.revenue)}
                            {v.discountTotal > 0 && <div className="text-muted-foreground text-xs">diskon {formatIDR(v.discountTotal)}</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant}>{label}</Badge>
                          </TableCell>
                          <TableCell>
                            <VoucherActions storeId={storeId} code={v.code} active={v.active} used={v.used_count} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}
