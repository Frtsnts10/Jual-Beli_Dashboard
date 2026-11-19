"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestSellerDeletion } from "./account-actions";

/** Seller's "Hapus akun" request (opened from the account menu). */
export function DeleteAccountDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus akun penjual</DialogTitle>
          <DialogDescription>Pengajuan ditinjau admin platform dalam 7 hari. Setelah disetujui:</DialogDescription>
        </DialogHeader>
        <ul className="text-muted-foreground grid list-inside list-disc gap-1 text-sm">
          <li>Semua toko Anda ditutup permanen dan stok di brankas dihapus.</li>
          <li>Login dan profil Anda dihapus; Anda keluar dari toko lain tempat Anda jadi admin.</li>
          <li>Riwayat pesanan tetap tersimpan agar pembeli masih punya struk.</li>
          <li>Sisa masa paket tidak dikembalikan.</li>
        </ul>
        <div className="grid gap-2">
          <Label htmlFor="del-reason">Alasan (opsional)</Label>
          <Textarea id="del-reason" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="del-confirm">
            Ketik <b>HAPUS</b> untuk konfirmasi
          </Label>
          <Input id="del-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />
        </div>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={pending || confirm.trim().toUpperCase() !== "HAPUS"}
            onClick={() =>
              start(async () => {
                const res = await requestSellerDeletion(reason, confirm);
                if (!res.ok) return void toast.error(res.error);
                toast.success("Pengajuan terkirim. Admin akan memprosesnya dalam 7 hari.");
                setConfirm("");
                onOpenChange(false);
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Ajukan hapus akun
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
