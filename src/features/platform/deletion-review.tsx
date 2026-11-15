"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { approveAccountDeletion, rejectAccountDeletion } from "./actions";

/** Approve (delete now) or reject (with a reason the buyer sees) one deletion request. */
export function DeletionReview({ r }: { r: { uid: string; email: string; orders: number; isSeller: boolean } }) {
  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        setRejecting(false);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Tinjau</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus akun pembeli?</DialogTitle>
          <DialogDescription className="break-all">{r.email}</DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground grid list-inside list-disc gap-1 text-sm">
          <li>{r.isSeller ? "Profil pembeli dihapus. Login tetap ada karena dipakai sebagai akun penjual." : "Login dan profil pembeli dihapus permanen."}</li>
          <li>{r.orders} pesanan tetap tersimpan untuk penjual, tapi tidak lagi terhubung ke akun ini.</li>
          <li>Ulasannya tetap tampil dengan nama “Pembeli”.</li>
        </ul>
        {rejecting && (
          <Input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan penolakan (dilihat pembeli)" maxLength={300} />
        )}
        <DialogFooter className="gap-2 sm:gap-2">
          {rejecting ? (
            <>
              <Button variant="outline" disabled={pending} onClick={() => setRejecting(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await rejectAccountDeletion(r.uid, reason);
                    if (!res.ok) return void toast.error(res.error);
                    toast.success("Pengajuan ditolak");
                    setOpen(false);
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <XCircle />} Tolak pengajuan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" disabled={pending} onClick={() => setRejecting(true)}>
                <XCircle /> Tolak
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const res = await approveAccountDeletion(r.uid);
                    if (!res.ok) return void toast.error(res.error);
                    toast.success(res.data?.loginDeleted ? "Akun dihapus" : "Profil pembeli dihapus (login penjual tetap)");
                    setOpen(false);
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Setujui & hapus
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
