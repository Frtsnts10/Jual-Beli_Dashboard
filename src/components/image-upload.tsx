"use client";

/* eslint-disable @next/next/no-img-element -- seller-uploaded images on Firebase Storage */
import { useRef, useState, useTransition } from "react";
import { ImageUp, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { uploadStoreImage } from "@/features/media/actions";
import type { MediaKind } from "@/lib/media-kinds";
import { dataUrlToBlob } from "@/lib/image-blob";

/** Longest side after resizing, per use. */
const MAX_DIM: Record<MediaKind, number> = {
  logo: 512,
  product: 1200,
  banner: 1920,
};

/** Decodes any image the browser can read (JPG, PNG, WebP, AVIF, GIF, BMP, JFIF…). */
async function decode(file: File): Promise<{ img: CanvasImageSource; width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    return { img: bitmap, width: bitmap.width, height: bitmap.height };
  } catch {
    // Some browsers can show a format that createImageBitmap refuses; an <img> decodes those.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { img, width: img.naturalWidth, height: img.naturalHeight };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Resizes in the browser and re-encodes (WebP where supported, else JPEG) to stay small. */
export async function compress(file: File, maxDim: number): Promise<string> {
  const { img, width, height } = await decode(file);
  if (!width || !height) throw new Error("EMPTY");
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d")!;
  // Transparent PNG/GIF would turn black as JPEG.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const webp = canvas.toDataURL("image/webp", 0.85).startsWith("data:image/webp");
  for (const q of [0.85, 0.75, 0.6, 0.45]) {
    const url = canvas.toDataURL(webp ? "image/webp" : "image/jpeg", q);
    if (url.length < 3_000_000) return url;
  }
  return canvas.toDataURL("image/jpeg", 0.4);
}

/**
 * Pick an image → it's resized, uploaded to Firebase Storage and its URL handed back through
 * onChange. "Pakai URL" still accepts a link to an image hosted elsewhere.
 */
export function ImageUpload({
  storeId,
  kind,
  value,
  onChange,
  aspect = "aspect-video",
  label = "Unggah gambar",
}: {
  storeId: string;
  kind: MediaKind;
  value: string;
  onChange: (url: string) => void;
  /** Preview box shape, e.g. "aspect-square" for logos. */
  aspect?: string;
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [byUrl, setByUrl] = useState(false);

  const [over, setOver] = useState(false);

  const pick = (file?: File | null) => {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/")) return void toast.error("File ini bukan gambar.");
    start(async () => {
      let data: string;
      try {
        data = await compress(file, MAX_DIM[kind]);
      } catch {
        return void toast.error(
          /hei[cf]/i.test(file.type + file.name)
            ? "Foto HEIC (iPhone) belum bisa dibuka di browser ini. Simpan sebagai JPG dulu, atau pakai Chrome/Safari terbaru."
            : "Gambar tidak bisa dibuka. Coba simpan ulang sebagai JPG atau PNG.",
        );
      }
      try {
        const res = await uploadStoreImage(storeId, kind, dataUrlToBlob(data));
        if (!res.ok) return void toast.error(res.error);
        onChange(res.data!.url);
        toast.success("Foto terunggah. Jangan lupa simpan.");
      } catch {
        toast.error("Gagal mengunggah. Periksa koneksi lalu coba lagi.");
      }
    });
  };

  return (
    <div className="grid gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        title="Klik, seret gambar ke sini, atau tempel (Ctrl+V)"
        onClick={() => !pending && input.current?.click()}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          input.current?.click();
        }}
        onPaste={(e) => {
          const file = [...e.clipboardData.files].find((f) => f.type.startsWith("image/"));
          if (!file) return;
          e.preventDefault();
          pick(file);
        }}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "bg-muted relative flex w-full max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-md border",
          over && "border-primary ring-primary/30 ring-2",
          aspect,
        )}
      >
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImageUp className="text-muted-foreground size-6" />
        )}
        {pending && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          <ImageUp /> {value ? "Ganti" : label}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setByUrl((v) => !v)}
        >
          <Link2 /> Pakai URL
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            aria-label="Hapus gambar"
            onClick={() => onChange("")}
          >
            <Trash2 />
          </Button>
        )}
      </div>
      {byUrl && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          placeholder="https://…"
        />
      )}
    </div>
  );
}
