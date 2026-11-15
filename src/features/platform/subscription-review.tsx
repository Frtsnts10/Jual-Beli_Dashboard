"use client";

/* eslint-disable @next/next/no-img-element -- seller-uploaded proof, served as a data URL */
import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, ReceiptText, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate, formatIDR } from "@/lib/utils";
import { confirmSubscriptionPayment, getSubscriptionProof, rejectSubscription } from "./actions";

export interface PendingPurchase {
  id: string;
  email: string;
  plan: string;
  amount: number;
  uniqueCode: number;
  proofAt: string | null;
  payBy: string | null;
}

/** Plan purchase review: proof next to the exact amount to find in the platform's QRIS mutations. */
export function SubscriptionReview({ p }: { p: PendingPurchase }) {
  const [open, setOpen] = useState(false);
  const [proof, setProof] = useState<{ image: string } | "none" | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("Dana tidak masuk");
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(msg);
      setOpen(false);
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setRejecting(false);
        if (o && proof === null)
          start(async () => {
            const res = await getSubscriptionProof(p.id);
            setProof(res.ok && res.data ? res.data : "none");
          });
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={p.proofAt ? "default" : "outline"}>
          <ReceiptText /> {p.proofAt ? "Cek bukti" : "Belum ada bukti"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Konfirmasi pembelian paket</DialogTitle>
          <DialogDescription>
            {p.email} · {p.plan}. Cek mutasi QRIS platform: harus ada dana masuk <b className="text-foreground">persis {formatIDR(p.amount)}</b> (kode unik{" "}
            {p.uniqueCode}).
          </DialogDescription>
        </DialogHeader>
        {proof === null ? (
          <div className="text-muted-foreground flex h-40 items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" /> Memuat bukti…
          </div>
        ) : proof === "none" ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            Seller belum mengunggah bukti{p.payBy ? ` (batas ${formatDate(p.payBy, true)})` : ""}.
          </p>
        ) : (
          <a href={proof.image} target="_blank" rel="noreferrer">
            <img src={proof.image} alt={`Bukti bayar ${p.id}`} className="mx-auto max-h-[50svh] rounded-lg border object-contain" />
          </a>
        )}
        {rejecting && <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} aria-label="Alasan penolakan" />}
        <DialogFooter className="gap-2 sm:justify-between">
          {rejecting ? (
            <Button variant="destructive" disabled={pending} onClick={() => act(() => rejectSubscription(p.id, reason), "Pembayaran ditolak")}>
              <XCircle /> Tolak pembayaran
            </Button>
          ) : (
            <Button variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
              <XCircle /> Tolak
            </Button>
          )}
          <Button
            disabled={pending || proof === null}
            onClick={() =>
              (proof !== "none" || confirm("Belum ada bukti. Yakin dana sudah masuk?")) && act(() => confirmSubscriptionPayment(p.id), "Paket diaktifkan")
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Dana masuk, aktifkan paket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
