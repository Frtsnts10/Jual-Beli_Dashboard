"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, MessageCircle, MoreHorizontal, PackagePlus, RefreshCw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatDate, formatIDR } from "@/lib/utils";
import { fillTemplate, waNumber } from "@/lib/whatsapp";
import type { Credential, Order } from "@/types/schema";
import { confirmPayment, markDelivered, rejectWarranty, replaceWarranty } from "./actions";

type Filter = "all" | "action" | "claims";

const needsAction = (o: Order) =>
  o.warranty_status === "CLAIMED" || (o.payment_status === "PAID" && (o.needs_stock || o.delivery_status === "PENDING"));

export function OrdersTable({
  storeId,
  storeName,
  orders,
  credentials,
  waTemplate,
}: {
  storeId: string;
  storeName: string;
  orders: Order[];
  credentials: Record<string, Credential>;
  waTemplate: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, start] = useTransition();

  const visible = useMemo(
    () =>
      orders.filter((o) => (filter === "all" ? true : filter === "claims" ? o.warranty_status === "CLAIMED" : needsAction(o))),
    [orders, filter]
  );

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(success);
      else toast.error(res.error);
    });

  function sendViaWhatsApp(o: Order) {
    const cred = o.credential_id ? credentials[o.credential_id] : undefined;
    if (!cred) return toast.error("Akun belum dialokasikan.");
    const text = fillTemplate(waTemplate, {
      product: o.product_title,
      store: storeName,
      email: cred.account_email,
      password: cred.account_password,
      pin: cred.profile_pin || "-",
      expiry: formatDate(o.access_expires_at),
      order_id: o.id,
    });
    window.open(`https://wa.me/${waNumber(o.customer_contact.phone)}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    run(() => markDelivered(storeId, o.id), "Ditandai terkirim");
  }

  const counts = { all: orders.length, action: orders.filter(needsAction).length, claims: orders.filter((o) => o.warranty_status === "CLAIMED").length };

  return (
    <>
      <div className="bg-muted mb-4 inline-flex h-9 items-center rounded-lg p-[3px]">
        {(
          [
            ["all", "Semua"],
            ["action", "Perlu tindakan"],
            ["claims", "Klaim garansi"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn("rounded-md px-3 py-1 text-sm font-medium", filter === key ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {label} ({counts[key]})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">Tidak ada pesanan.</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pesanan</TableHead>
                <TableHead>Pembeli</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Bayar</TableHead>
                <TableHead>Kirim</TableHead>
                <TableHead>Garansi</TableHead>
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
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">{o.customer_contact.email}</div>
                    <div className="text-muted-foreground text-xs">{o.customer_contact.phone}</div>
                  </TableCell>
                  <TableCell className="text-right">{formatIDR(o.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={o.payment_status === "PAID" ? "success" : o.payment_status === "FAILED" ? "destructive" : "warning"}>
                      {o.payment_status}
                    </Badge>
                    {o.needs_stock && <div className="text-destructive mt-1 text-xs">Stok kosong</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.delivery_status === "SENT_VIA_WA" ? "success" : "secondary"}>
                      {o.delivery_status === "SENT_VIA_WA" ? "Terkirim" : "Belum"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-56 whitespace-normal">
                    <Badge variant={o.warranty_status === "CLAIMED" ? "destructive" : o.warranty_status === "REPLACED" ? "secondary" : "outline"}>
                      {o.warranty_status}
                    </Badge>
                    {o.warranty_status === "CLAIMED" && o.warranty_claim && (
                      <div className="text-muted-foreground mt-1 text-xs">“{o.warranty_claim.reason}”</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Aksi" disabled={pending}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {o.payment_status !== "PAID" && (
                          <DropdownMenuItem
                            onSelect={() => confirm(`Konfirmasi pembayaran ${formatIDR(o.amount)} untuk ${o.id} secara manual?`) && run(() => confirmPayment(storeId, o.id), "Pesanan lunas")}
                          >
                            <CheckCircle2 /> Konfirmasi lunas manual
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
