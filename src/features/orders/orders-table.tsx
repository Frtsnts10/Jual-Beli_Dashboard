"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, MessageCircle, MoreHorizontal, PackagePlus, RefreshCw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate, formatIDR } from "@/lib/utils";
import { deliveryMessage, waNumber } from "@/lib/integrations/whatsapp";
import type { Credential, Order } from "@/types/schema";
import { confirmPayment, markDelivered, rejectWarranty, replaceWarranty, resendDelivery } from "./actions";
import { PaymentReview } from "./payment-review";

type Filter = "all" | "confirm" | "action" | "claims";

/** QRIS payment the buyer says they made: the seller checks the proof and confirms or rejects. */
const awaitingConfirmation = (o: Order) => o.payment_status === "PENDING" && !!o.proof_uploaded_at;
const needsAction = (o: Order) =>
  awaitingConfirmation(o) || o.warranty_status === "CLAIMED" || (o.payment_status === "PAID" && (o.needs_stock || o.delivery_status === "PENDING"));

export function OrdersTable({
  storeId,
  storeName,
  orders,
  credentials,
  productTitles,
  waTemplate,
}: {
  productTitles: Record<string, string>;
  storeId: string;
  storeName: string;
  orders: Order[];
  credentials: Record<string, Credential>;
  waTemplate: string;
}) {
  const [filter, setFilter] = useState<Filter>(() => (orders.some(awaitingConfirmation) ? "confirm" : "all"));
  const [pending, start] = useTransition();

  const visible = useMemo(
    () =>
      orders.filter((o) =>
        filter === "all" ? true : filter === "confirm" ? awaitingConfirmation(o) : filter === "claims" ? o.warranty_status === "CLAIMED" : needsAction(o)
      ),
    [orders, filter]
  );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(success);
      else toast.error(res.error);
    });

  function sendViaWhatsApp(o: Order) {
    const creds = o.credential_ids.map((id) => credentials[id]).filter(Boolean);
    if (creds.length === 0) return toast.error("Akun belum dialokasikan.");
    const text = deliveryMessage(
      waTemplate,
      { store: storeName, order_id: o.id, expiry: formatDate(o.access_expires_at) },
      creds.map((c) => ({
        product: creds.length > 1 ? (productTitles[c.product_id] ?? o.product_title) : o.product_title,
        email: c.account_email,
        password: c.account_password,
        pin: c.profile_pin,
      }))
    );
    window.open(`https://wa.me/${waNumber(o.customer_contact.phone)}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    run(() => markDelivered(storeId, o.id), "Ditandai terkirim");
  }

  const actionsMenu = (o: Order) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Aksi" disabled={pending}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {o.payment_status === "FAILED" && (
          <DropdownMenuItem
            onSelect={() => confirm(`Pesanan ${o.id} sudah gagal/ditolak. Tandai lunas karena dana ${formatIDR(o.amount)} ternyata masuk?`) && run(() => confirmPayment(storeId, o.id), "Pesanan lunas")}
          >
            <CheckCircle2 /> Ternyata sudah dibayar
          </DropdownMenuItem>
        )}
        {o.payment_status === "PAID" && o.needs_stock && (
          <DropdownMenuItem onSelect={() => run(() => confirmPayment(storeId, o.id), "Stok dialokasikan")}>
            <PackagePlus /> Alokasikan stok
          </DropdownMenuItem>
        )}
        {o.payment_status === "PAID" && o.credential_id && (
          <DropdownMenuItem onSelect={() => sendViaWhatsApp(o)}>
            <MessageCircle /> Kirim akun via WhatsApp
          </DropdownMenuItem>
        )}
        {o.credential_id && o.delivery_error && (
          <DropdownMenuItem onSelect={() => run(() => resendDelivery(storeId, o.id), "Terkirim otomatis")}>
            <RefreshCw /> Kirim ulang otomatis
          </DropdownMenuItem>
        )}
        {o.credential_id && o.delivery_status === "PENDING" && (
          <DropdownMenuItem onSelect={() => run(() => markDelivered(storeId, o.id), "Ditandai terkirim")}>
            <Send /> Tandai terkirim
          </DropdownMenuItem>
        )}
        {o.warranty_status === "CLAIMED" && (
          <>
            <DropdownMenuItem onSelect={() => run(() => replaceWarranty(storeId, o.id), "Akun diganti")}>
              <RefreshCw /> Ganti akun (1-klik)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => rejectWarranty(storeId, o.id), "Klaim ditolak")}>
              <XCircle /> Tolak klaim
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const payBadge = (o: Order) =>
    o.payment_status === "PENDING" ? (
      <PaymentReview storeId={storeId} order={o} compact />
    ) : (
      <Badge variant={o.payment_status === "PAID" ? "success" : "destructive"} title={o.rejected_reason ?? undefined}>
        {o.payment_status === "PAID" ? "Lunas" : o.rejected_reason ? "Ditolak/batal" : "Gagal"}
      </Badge>
    );
  const amount = (o: Order) => (
    <>
      <span className="font-medium tabular-nums">{formatIDR(o.amount)}</span>
      <div className="text-muted-foreground text-xs">
        {[o.unique_code ? `kode unik ${o.unique_code}` : null, o.voucher_code ? `voucher ${o.voucher_code}` : null].filter(Boolean).join(" · ") || "QRIS"}
      </div>
    </>
  );

  const counts = {
    all: orders.length,
    confirm: orders.filter(awaitingConfirmation).length,
    action: orders.filter(needsAction).length,
    claims: orders.filter((o) => o.warranty_status === "CLAIMED").length,
  };

  return (
    <>
      <div className="bg-muted mb-4 inline-flex h-9 max-w-full items-center overflow-x-auto rounded-lg p-[3px]">
        {(
          [
            ["confirm", "Cek pembayaran"],
            ["all", "Semua"],
            ["action", "Perlu tindakan"],
            ["claims", "Klaim garansi"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn("shrink-0 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap", filter === key ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">Tidak ada pesanan.</p>
      ) : (
        <>
          {/* Phone: one card per order. */}
          <div className="grid gap-2 md:hidden">
            {visible.map((o) => (
              <div key={o.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{o.product_title}</div>
                    <div className="text-muted-foreground font-mono text-xs">
                      {o.id} · {formatDate(o.created_at, true)}
                    </div>
                  </div>
                  <div className="-mt-1 -mr-1 shrink-0">{actionsMenu(o)}</div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="min-w-0 text-xs">
                    <div className="break-all">{o.customer_contact.email}</div>
                    <div className="text-muted-foreground">{o.customer_contact.phone}</div>
                  </div>
                  <div className="shrink-0 text-right">{amount(o)}</div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {payBadge(o)}
                  <Badge variant={o.delivery_status === "SENT_VIA_WA" ? "success" : "secondary"}>{o.delivery_status === "SENT_VIA_WA" ? "Terkirim" : "Belum dikirim"}</Badge>
                  {o.warranty_status !== "VALID" && (
                    <Badge variant={o.warranty_status === "CLAIMED" ? "destructive" : "secondary"}>Garansi {o.warranty_status}</Badge>
                  )}
                  {o.needs_stock && <span className="text-destructive text-xs">Stok kosong</span>}
                  {o.delivery_error && o.delivery_status !== "SENT_VIA_WA" && <span className="text-destructive text-xs">Auto-kirim gagal</span>}
                </div>
                {o.warranty_status === "CLAIMED" && o.warranty_claim && <p className="text-muted-foreground mt-2 text-xs">“{o.warranty_claim.reason}”</p>}
              </div>
            ))}
          </div>

          {/* Tablet and up; buyer + warranty fold into other columns below xl. */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pesanan</TableHead>
                  <TableHead className="hidden xl:table-cell">Pembeli</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Bayar</TableHead>
                  <TableHead>Kirim</TableHead>
                  <TableHead className="hidden xl:table-cell">Garansi</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <div className="font-medium">{o.product_title}</div>
                      <div className="text-muted-foreground font-mono text-xs">
                        {o.id} · {formatDate(o.created_at, true)}
                      </div>
                      <div className="text-muted-foreground text-xs xl:hidden">{o.customer_contact.email}</div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-xs">{o.customer_contact.email}</div>
                      <div className="text-muted-foreground text-xs">{o.customer_contact.phone}</div>
                    </TableCell>
                    <TableCell className="text-right">{amount(o)}</TableCell>
                    <TableCell>
                      {payBadge(o)}
                      {o.needs_stock && <div className="text-destructive mt-1 text-xs">Stok kosong</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={o.delivery_status === "SENT_VIA_WA" ? "success" : "secondary"}>
                        {o.delivery_status === "SENT_VIA_WA" ? "Terkirim" : "Belum"}
                      </Badge>
                      {o.delivery_error && o.delivery_status !== "SENT_VIA_WA" && (
                        <div className="text-destructive mt-1 max-w-40 truncate text-xs" title={o.delivery_error}>
                          Auto-kirim gagal
                        </div>
                      )}
                      {o.warranty_status !== "VALID" && (
                        <div className="mt-1 xl:hidden">
                          <Badge variant={o.warranty_status === "CLAIMED" ? "destructive" : "secondary"}>Garansi {o.warranty_status}</Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden max-w-56 whitespace-normal xl:table-cell">
                      <Badge variant={o.warranty_status === "CLAIMED" ? "destructive" : o.warranty_status === "REPLACED" ? "secondary" : "outline"}>
                        {o.warranty_status}
                      </Badge>
                      {o.warranty_status === "CLAIMED" && o.warranty_claim && (
                        <div className="text-muted-foreground mt-1 text-xs">“{o.warranty_claim.reason}”</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {actionsMenu(o)}
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
