/* eslint-disable @next/next/no-img-element -- seller-supplied logo URL */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { groupOf } from "@/lib/payments/manual";
import { mapOrder } from "@/lib/data/mappers";
import { formatDate, formatIDR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/features/orders/print-button";

export const metadata = { title: "Struk pembelian" };

/**
 * The seller's copy of a paid order's receipt (one product or a whole cart). It lives in the
 * dashboard so it opens wherever the storefront is hosted; the buyer has the same receipt on
 * the storefront at /struk/<id>.
 */
export default async function SellerReceiptPage({ params }: { params: Promise<{ storeId: string; orderId: string }> }) {
  const { storeId, orderId } = await params;
  const { store } = await requireStore(storeId);
  const group = (await groupOf(storeId, orderId)).map(mapOrder);
  if (group.length === 0) notFound();
  const lead = group.find((o) => o.id === o.group_id) ?? group[0];
  const members = group.filter((o) => o.payment_status === "PAID");
  if (members.length === 0) notFound();

  const discount = members.reduce((s, m) => s + m.discount, 0);
  const voucher = members.find((m) => m.voucher_code)?.voucher_code;
  const total = members.length === lead.group_size ? lead.group_total : members.reduce((s, m) => s + m.amount, 0);

  return (
    <main className="bg-muted/40 min-h-svh px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-md print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${storeId}/orders`}>
            <ArrowLeft /> Kembali ke pesanan
          </Link>
        </Button>
      </div>
      <article className="bg-background mx-auto w-full max-w-md rounded-sm border p-6 text-sm shadow-xs sm:p-8 print:max-w-none print:border-0 print:shadow-none">
        <header className="flex items-center gap-3 border-b pb-4">
          {store.storefront_config.logo_url && <img src={store.storefront_config.logo_url} alt="" className="size-10 rounded-sm object-cover" />}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{store.store_name}</p>
            <p className="text-muted-foreground text-xs">Struk pembelian</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-sm bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" /> LUNAS
          </span>
        </header>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b py-4">
          <dt className="text-muted-foreground">No. struk</dt>
          <dd className="text-right font-mono">{lead.id}</dd>
          <dt className="text-muted-foreground">Dibayar</dt>
          <dd className="text-right">{formatDate(lead.paid_at, true)}</dd>
          <dt className="text-muted-foreground">Metode</dt>
          <dd className="text-right">QRIS{store.payment?.merchant_name ? ` · ${store.payment.merchant_name}` : ""}</dd>
          <dt className="text-muted-foreground">Pembeli</dt>
          <dd className="text-right break-all">
            {lead.customer_contact.email}
            <br />
            {lead.customer_contact.phone}
          </dd>
        </dl>

        <ul className="divide-y border-b">
          {members.map((m) => (
            <li key={m.id} className="flex justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium">{m.product_title}</p>
                <p className="text-muted-foreground font-mono text-xs">{m.id}</p>
                {m.access_expires_at && <p className="text-muted-foreground text-xs">Aktif s/d {formatDate(m.access_expires_at)}</p>}
              </div>
              <span className="shrink-0 tabular-nums">{formatIDR(m.amount + m.discount - m.unique_code)}</span>
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-[1fr_auto] gap-y-1 pt-4">
          {discount > 0 && (
            <>
              <dt className="text-muted-foreground">Voucher{voucher ? ` ${voucher}` : ""}</dt>
              <dd className="text-right text-emerald-700 tabular-nums">−{formatIDR(discount)}</dd>
            </>
          )}
          {lead.unique_code > 0 && (
            <>
              <dt className="text-muted-foreground">Kode unik</dt>
              <dd className="text-right tabular-nums">+{formatIDR(lead.unique_code)}</dd>
            </>
          )}
          <dt className="text-base font-semibold">Total</dt>
          <dd className="text-right text-base font-bold tabular-nums">{formatIDR(total)}</dd>
        </dl>
      </article>
      <div className="mx-auto mt-6 flex max-w-md justify-center print:hidden">
        <PrintButton />
      </div>
    </main>
  );
}
