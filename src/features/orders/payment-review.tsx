"use client";

/* eslint-disable @next/next/no-img-element -- buyer-uploaded proof, served as a data URL */
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ReceiptText, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, formatIDR } from "@/lib/utils";
import type { Order } from "@/types/schema";
import { confirmPayment, getPaymentProof, rejectPayment } from "./actions";

/** "Cek bukti": the buyer's screenshot next to the exact amount to look for in the QRIS mutations. */
export function PaymentReview({ storeId, order, compact = false }: { storeId: string; order: Order; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState<{ image: string; uploadedAt: string | null } | null | "none">(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("Dana tidak masuk");
  const [pending, start] = useTransition();
  const hasProof = !!order.proof_uploaded_at;

  const load = () =>
    start(async () => {
      const res = await getPaymentProof(storeId, order.id);
      setProof(res.ok && res.data ? res.data : "none");
    });
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(success);
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setRejecting(false);
        if (o && proof === null) load();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={hasProof ? "default" : "outline"} className={compact ? "h-7 px-2 text-xs" : undefined}>
          <ReceiptText /> {hasProof ? "Cek bukti" : "Belum ada bukti"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Konfirmasi pembayaran</DialogTitle>
          <DialogDescription>
            Cek mutasi QRIS Anda: harus ada dana masuk <b className="text-foreground">persis {formatIDR(order.amount)}</b>
            {order.unique_code > 0 && <> (termasuk kode unik {order.unique_code})</>}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <div className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-3 [&>*]:min-w-0">
            <div>
              <div className="text-muted-foreground text-xs">Pesanan</div>
              <div className="truncate font-medium">{order.product_title}</div>
              <div className="text-muted-foreground font-mono text-xs">{order.id}</div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-xs">Nominal</div>
              <div className="text-lg font-bold tabular-nums">{formatIDR(order.amount)}</div>
              {order.voucher_code && <div className="text-muted-foreground text-xs">voucher {order.voucher_code}</div>}
            </div>
            <div className="col-span-2 text-xs break-all">
              {order.customer_contact.email} · {order.customer_contact.phone}
            </div>
          </div>
          {proof === null || (pending && !rejecting && proof === null) ? (
            <div className="text-muted-foreground flex h-40 items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Memuat bukti…
            </div>
          ) : proof === "none" ? (
            <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              Pembeli belum mengunggah bukti. Pesanan otomatis batal jika tidak dibayar sebelum {formatDate(order.pay_by, true)}.
            </p>
          ) : (
            <figure className="grid gap-1">
              <a href={proof.image} target="_blank" rel="noreferrer" title="Buka ukuran penuh">
                <img src={proof.image} alt={`Bukti bayar ${order.id}`} className="mx-auto max-h-[50svh] rounded-lg border object-contain" />
              </a>
              {proof.uploadedAt && <figcaption className="text-muted-foreground text-center text-xs">Diunggah {formatDate(proof.uploadedAt, true)}</figcaption>}
            </figure>
          )}
          {rejecting && (
            <div className="grid gap-2">
              <label htmlFor={`reason-${order.id}`} className="text-xs font-medium">
                Alasan penolakan (dilihat pembeli)
              </label>
              <Input id={`reason-${order.id}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {rejecting ? (
            <>
              <Button variant="ghost" onClick={() => setRejecting(false)} disabled={pending}>
                Batal
              </Button>
              <Button variant="destructive" disabled={pending} onClick={() => act(() => rejectPayment(storeId, order.id, reason), "Pembayaran ditolak")}>
                <XCircle /> Tolak pembayaran
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setRejecting(true)} disabled={pending}>
                <XCircle /> Tolak
              </Button>
              <Button
                disabled={pending || proof === null}
                onClick={() =>
                  (proof !== "none" || confirm("Belum ada bukti dari pembeli. Yakin dana sudah masuk?")) &&
                  act(() => confirmPayment(storeId, order.id), "Lunas — akun dialokasikan")
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Dana masuk, konfirmasi
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
