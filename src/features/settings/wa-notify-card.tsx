"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateWaNotifications } from "@/features/stores/actions";

/** Payment notifications over WhatsApp: to the buyer (confirmed / rejected) and to the seller (proof received). */
export function WaNotifyCard({
  storeId,
  allowed,
  ready,
  notifyBuyer,
  sellerPhone,
}: {
  storeId: string;
  /** Pro & Ultimate. */
  allowed: boolean;
  /** A WhatsApp provider and token are saved above. */
  ready: boolean;
  notifyBuyer: boolean;
  sellerPhone: string | null;
}) {
  const [buyer, setBuyer] = useState(notifyBuyer);
  const [seller, setSeller] = useState(!!sellerPhone);
  const [phone, setPhone] = useState(sellerPhone ?? "");
  const [pending, start] = useTransition();
  const off = !allowed || !ready;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifikasi pembayaran</CardTitle>
        <CardDescription>
          {!allowed
            ? "Paket Pro & Ultimate: kabar pembayaran otomatis ke WhatsApp pembeli dan ke nomor Anda. Bukti bayar baru tetap masuk ke lonceng notifikasi di semua paket."
            : !ready
              ? "Atur provider & token WhatsApp di atas dulu. Bukti bayar baru tetap masuk ke lonceng notifikasi."
              : "Dikirim lewat provider WhatsApp di atas. Bukti bayar baru juga selalu masuk ke lonceng notifikasi."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="wa-buyer">Kabari pembeli</Label>
            <p className="text-muted-foreground text-xs">Saat pembayaran dikonfirmasi (dengan link struk) atau ditolak (dengan alasannya).</p>
          </div>
          <Switch id="wa-buyer" checked={buyer && !off} disabled={off} onCheckedChange={setBuyer} />
        </div>
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="wa-seller">Kabari saya saat ada bukti bayar masuk</Label>
              <p className="text-muted-foreground text-xs">Supaya pesanan cepat dikonfirmasi walau dashboard sedang tidak dibuka.</p>
            </div>
            <Switch id="wa-seller" checked={seller && !off} disabled={off} onCheckedChange={setSeller} />
          </div>
          {seller && !off && (
            <div className="grid gap-2 md:max-w-xs">
              <Label htmlFor="wa-seller-phone">Nomor WhatsApp Anda</Label>
              <Input id="wa-seller-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812xxxxxxxx" />
              <p className="text-muted-foreground text-xs">Sebaiknya bukan nomor yang dipakai provider (pesan ke diri sendiri sering tidak muncul).</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={pending || off}
          onClick={() =>
            start(async () => {
              const res = await updateWaNotifications(storeId, { buyer, sellerPhone: seller ? phone : "" });
              if (!res.ok) return void toast.error(res.error);
              toast.success("Notifikasi disimpan");
            })
          }
        >
          Simpan notifikasi
        </Button>
      </CardFooter>
    </Card>
  );
}
