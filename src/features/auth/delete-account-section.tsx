"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { reauthenticate } from "./reauth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { cancelMyAccountDeletion, requestMyAccountDeletion } from "./account-actions";

const PHRASE = "HAPUS AKUN SAYA";

export interface AccountFootprint {
  stores: string[];
  products: number;
  orders: number;
  stock: number;
}

export interface DeletionRequestState {
  status: "PENDING" | "REJECTED";
  requested_at: string;
  rejected_reason: string | null;
}

/**
 * Settings → Akun: the danger zone. The seller asks for deletion; a platform admin approves it,
 * which wipes the account and every store it owns. A pending request can be withdrawn.
 */
export function DeleteAccountSection({
  email,
  footprint,
  verifyWith,
  request,
}: {
  email: string;
  footprint: AccountFootprint;
  verifyWith: "password" | "google";
  request: DeletionRequestState | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [armed, setArmed] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const ready = typedEmail.trim().toLowerCase() === email.toLowerCase() && phrase.trim() === PHRASE && (verifyWith === "google" || password.length > 0);

  const verify = () => reauthenticate(verifyWith, email, password);

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4" /> Zona berbahaya: hapus akun
        </CardTitle>
        <CardDescription>
          Ajukan penghapusan akun; admin platform meninjau dan menghapusnya. Setelah disetujui, penghapusan permanen dan tidak bisa dibatalkan.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        <div className="bg-destructive/5 rounded-lg p-4">
          <p className="font-medium">Yang akan terhapus selamanya:</p>
          <ul className="text-muted-foreground mt-2 grid list-inside list-disc gap-1">
            <li>
              {footprint.stores.length} toko{footprint.stores.length ? ` (${footprint.stores.join(", ")})` : ""} beserta etalase, alamat dan domainnya
            </li>
            <li>{footprint.products} produk dan {footprint.stock} stok akun di brankas</li>
            <li>{footprint.orders} pesanan: seluruh riwayat penjualan, bukti bayar dan struk pembeli</li>
            <li>Pelanggan, voucher, ulasan, broadcast, tim, banner dan gambar toko</li>
            <li>Riwayat langganan, laporan bantuan, notifikasi, dan login Anda</li>
          </ul>
          <p className="text-muted-foreground mt-2">Sisa masa paket hangus. Unduh dulu data yang ingin Anda simpan (Analitik → Ekspor CSV).</p>
        </div>

        {request?.status === "PENDING" ? (
          <div className="grid gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
            <p className="flex items-center gap-2 font-medium">
              <Clock className="size-4" /> Pengajuan hapus akun menunggu persetujuan admin
            </p>
            <p className="text-muted-foreground">
              Diajukan {formatDate(request.requested_at, true)}. Toko dan data Anda tetap berjalan sampai admin menyetujuinya. Berubah pikiran? Batalkan pengajuan.
            </p>
            <Button
              variant="outline"
              className="w-fit"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await cancelMyAccountDeletion();
                  if (!res.ok) return void toast.error(res.error);
                  toast.success("Pengajuan hapus akun dibatalkan");
                  router.refresh();
                })
              }
            >
              Batalkan pengajuan
            </Button>
          </div>
        ) : !armed ? (
          <div className="grid gap-3">
            {request?.status === "REJECTED" && (
              <p className="text-destructive">Pengajuan sebelumnya ditolak admin{request.rejected_reason ? `: ${request.rejected_reason}` : "."} Anda bisa mengajukan lagi.</p>
            )}
            <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 w-fit" onClick={() => setArmed(true)}>
              <Trash2 /> Saya mengerti, lanjutkan hapus akun
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="del-email">Ketik email akun Anda ({email})</Label>
              <Input id="del-email" autoComplete="off" value={typedEmail} onChange={(e) => setTypedEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="del-phrase">
                Ketik <b>{PHRASE}</b>
              </Label>
              <Input id="del-phrase" autoComplete="off" value={phrase} onChange={(e) => setPhrase(e.target.value)} />
            </div>
            {verifyWith === "password" ? (
              <div className="grid gap-2">
                <Label htmlFor="del-password">Password akun</Label>
                <Input id="del-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">Saat menekan tombol ajukan, Anda akan diminta masuk dengan Google sekali lagi untuk memastikan ini memang Anda.</p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="del-reason">Alasan (opsional)</Label>
              <Textarea id="del-reason" maxLength={500} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" disabled={pending} onClick={() => setArmed(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={!ready || pending}
                onClick={() =>
                  start(async () => {
                    const idToken = await verify();
                    if (!idToken) return;
                    const res = await requestMyAccountDeletion({ email: typedEmail, phrase, idToken, reason });
                    if (!res.ok) return void toast.error(res.error);
                    toast.success("Pengajuan terkirim. Admin platform akan meninjaunya.");
                    setArmed(false);
                    setPassword("");
                    router.refresh();
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Ajukan hapus akun dan semua data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
