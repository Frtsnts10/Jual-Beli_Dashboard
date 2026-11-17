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

/** Longest side after resizing, per use. */
const MAX_DIM: Record<MediaKind, number> = { logo: 512, product: 1200, banner: 1920 };

/** Resizes in the browser and re-encodes (WebP where supported, else JPEG) to stay small. */
async function compress(file: File, maxDim: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
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

  const pick = (file?: File) =>
    file &&
    start(async () => {
      let data: string;
      try {
        data = await compress(file, MAX_DIM[kind]);
      } catch {
        return void toast.error("Gambar tidak bisa dibuka. Pakai JPG, PNG atau WebP.");
      }
      const res = await uploadStoreImage(storeId, kind, data);
      if (!res.ok) return void toast.error(res.error);
      onChange(res.data!.url);
    });

  return (
    <div className="grid gap-2">
      <div className={cn("bg-muted relative flex w-full max-w-xs items-center justify-center overflow-hidden rounded-md border", aspect)}>
        {value ? <img src={value} alt="" className="size-full object-cover" /> : <ImageUp className="text-muted-foreground size-6" />}
        {pending && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ""))} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={() => input.current?.click()}>
          <ImageUp /> {value ? "Ganti" : label}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setByUrl((v) => !v)}>
          <Link2 /> Pakai URL
        </Button>
        {value && (
          <Button type="button" variant="ghost" aria-label="Hapus gambar" onClick={() => onChange("")}>
            <Trash2 />
          </Button>
        )}
      </div>
      {byUrl && <Input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="https://…" />}
    </div>
  );
}
