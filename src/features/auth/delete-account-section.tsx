"use client";

import { useState, useTransition } from "react";
import { signOut } from "firebase/auth";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteMyAccount } from "./account-actions";

const PHRASE = "HAPUS AKUN SAYA";

export interface AccountFootprint {
  stores: string[];
  products: number;
  orders: number;
  stock: number;
}

/** Settings → Akun: the danger zone. Deleting wipes the account and every store it owns. */
export function DeleteAccountSection({ email, footprint }: { email: string; footprint: AccountFootprint }) {
  const [armed, setArmed] = useState(false);
  const [typedEmail, setTypedEmail] = useState("");
  const [phrase, setPhrase] = useState("");
  const [pending, start] = useTransition();
  const ready = typedEmail.trim().toLowerCase() === email.toLowerCase() && phrase.trim() === PHRASE;

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4" /> Zona berbahaya: hapus akun
        </CardTitle>
        <CardDescription>Menghapus akun bersifat permanen dan tidak bisa dibatalkan, juga oleh admin platform.</CardDescription>
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

        {!armed ? (
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 w-fit" onClick={() => setArmed(true)}>
            <Trash2 /> Saya mengerti, lanjutkan hapus akun
          </Button>
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
            <p className="text-muted-foreground text-xs">Demi keamanan, Anda harus masuk dalam 10 menit terakhir. Kalau belum, keluar dan masuk lagi dulu.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" disabled={pending} onClick={() => setArmed(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={!ready || pending}
                onClick={() =>
                  start(async () => {
                    const res = await deleteMyAccount({ email: typedEmail, phrase });
                    if (!res.ok) return void toast.error(res.error);
                    await signOut(auth).catch(() => {});
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = "/sign-in?deleted=1";
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} Hapus akun dan semua data selamanya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
