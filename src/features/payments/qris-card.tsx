"use client";

import { useRef, useState, useTransition } from "react";
import jsQR from "jsqr";
import { CheckCircle2, ImageUp, Loader2, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { inspectQris } from "@/lib/qris";
import { formatDate } from "@/lib/utils";
import type { StorePayment } from "@/types/schema";
import { removeStoreQris, saveStoreQris } from "./actions";

/** Reads the QR code out of an uploaded image entirely in the browser (the image is never uploaded). */
async function decodeQrImage(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  // Big phone photos: scale down so jsQR stays fast, but keep enough pixels for dense codes.
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

export function QrisCard({ storeId, payment }: { storeId: string; payment: StorePayment | null }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setReading(true);
    try {
      const payload = await decodeQrImage(file);
      if (!payload) return setError("QR tidak terbaca. Pakai gambar QRIS yang jelas (screenshot dari aplikasi merchant, atau foto stiker yang lurus dan tidak silau).");
      const info = inspectQris(payload);
      if (!info.ok) return setError(info.error);
      start(async () => {
        const res = await saveStoreQris(storeId, payload);
        if (!res.ok) return void setError(res.error);
        toast.success(`QRIS ${res.data?.merchant} tersimpan`);
      });
    } catch {
      setError("Gambar tidak bisa dibuka. Coba PNG/JPG lain.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const busy = pending || reading;
  return (
    <Card id="pembayaran" className="scroll-mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="size-5" /> Pembayaran — QRIS toko
        </CardTitle>
        <CardDescription>
          Pembeli membayar langsung ke QRIS Anda dengan nominal pas (ditambah kode unik). Mereka wajib mengunggah bukti bayar, lalu Anda konfirmasi di
          menu Pesanan setelah cek mutasi. Tanpa biaya platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {payment ? (
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold break-words">{payment.merchant_name || "QRIS aktif"}</div>
              <div className="text-xs opacity-80">
                {payment.nmid ? `NMID ${payment.nmid} · ` : ""}diperbarui {formatDate(payment.updated_at)}
              </div>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            Belum ada QRIS — pembeli belum bisa checkout.
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Upload gambar QRIS statis toko Anda (dari GoPay/OVO/DANA Merchant, QRIS bank, dll). Gambar hanya dibaca di browser; yang disimpan hanya kode QRIS-nya.
        </p>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2">
        {payment && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() =>
              confirm("Hapus QRIS? Pembeli tidak bisa checkout sampai Anda upload QRIS lagi.") &&
              start(async () => {
                const res = await removeStoreQris(storeId);
                if (!res.ok) toast.error(res.error);
              })
            }
          >
            <Trash2 /> Hapus
          </Button>
        )}
        <Button disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="animate-spin" /> : <ImageUp />} {payment ? "Ganti QRIS" : "Upload QRIS"}
        </Button>
      </CardFooter>
    </Card>
  );
}
