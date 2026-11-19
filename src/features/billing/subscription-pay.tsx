"use client";

/* eslint-disable @next/next/no-img-element -- local preview of the seller's screenshot */
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelSubscriptionPayment, uploadSubscriptionProof } from "./actions";

async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const q of [0.8, 0.65, 0.5]) {
    const url = canvas.toDataURL("image/jpeg", q);
    if (url.length < 900_000) return url;
  }
  return canvas.toDataURL("image/jpeg", 0.4);
}

/** Upload (or replace) the plan-purchase proof, or cancel the unpaid purchase. */
export function SubscriptionProof({ storeId, paymentId, hasProof }: { storeId: string; paymentId: string; hasProof: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    // Proof preview and its buttons sit side by side (wrap under each other only on narrow screens).
    <div className="flex flex-wrap items-end gap-4">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(await compress(f).catch(() => null));
          e.target.value = "";
        }}
      />
      {preview && <img src={preview} alt="Pratinjau bukti pembayaran" className="max-h-48 max-w-full rounded-lg border object-contain" />}
      <div className="flex flex-wrap gap-2">
        {preview ? (
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await uploadSubscriptionProof(storeId, paymentId, preview);
                if (!res.ok) return void toast.error(res.error);
                toast.success("Bukti terkirim — menunggu konfirmasi admin");
                setPreview(null);
                router.refresh();
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />} Kirim bukti
          </Button>
        ) : (
          <Button variant={hasProof ? "outline" : "default"} onClick={() => input.current?.click()}>
            <ImageUp /> {hasProof ? "Ganti bukti" : "Sudah bayar? Unggah bukti"}
          </Button>
        )}
        {!hasProof && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() =>
              confirm("Batalkan pembelian paket ini?") &&
              start(async () => {
                const res = await cancelSubscriptionPayment(storeId, paymentId);
                if (!res.ok) toast.error(res.error);
                router.refresh();
              })
            }
          >
            <X /> Batalkan
          </Button>
        )}
      </div>
    </div>
  );
}
