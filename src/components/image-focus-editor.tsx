"use client";

/* eslint-disable @next/next/no-img-element -- seller-uploaded images on Firebase Storage */
import { useRef } from "react";
import { Move, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { focusStyle, MAX_ZOOM, normalizeFocus, type ImageFocus } from "@/lib/image-focus";

const CENTER: ImageFocus = { x: 50, y: 50, zoom: 1 };

/**
 * "Atur posisi foto": drag the photo inside the frame to choose what stays in view, zoom with the
 * slider. Smaller previews show the same setting in the other frame shapes the store templates use.
 */
export function ImageFocusEditor({
  src,
  value,
  onChange,
}: {
  src: string;
  value: ImageFocus | null;
  onChange: (focus: ImageFocus | null) => void;
}) {
  const f = value ?? CENTER;
  const drag = useRef<{ x: number; y: number; start: ImageFocus; w: number; h: number } | null>(null);
  const set = (next: ImageFocus) => onChange(normalizeFocus(next));

  return (
    <div className="grid gap-3 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Move className="size-4" /> Atur posisi foto
        </span>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <RotateCcw /> Reset
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-3">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Posisi foto (geser)"
          aria-valuenow={Math.round(f.x)}
          aria-valuetext={`${Math.round(f.x)}%, ${Math.round(f.y)}%`}
          className="bg-muted relative aspect-square w-40 shrink-0 cursor-grab touch-none overflow-hidden rounded-md border active:cursor-grabbing"
          onPointerDown={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            drag.current = { x: e.clientX, y: e.clientY, start: f, w: r.width, h: r.height };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            // Dragging the photo right reveals more of its left side: the focal point moves left.
            const k = 100 / d.start.zoom;
            set({ ...d.start, x: d.start.x - ((e.clientX - d.x) / d.w) * k, y: d.start.y - ((e.clientY - d.y) / d.h) * k });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 10 : 2;
            const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const m = moves[e.key];
            if (!m) return;
            e.preventDefault();
            set({ ...f, x: f.x + m[0], y: f.y + m[1] });
          }}
        >
          <img src={src} alt="" draggable={false} className="pointer-events-none size-full object-cover select-none" style={focusStyle(f)} />
        </div>
        <div className="grid min-w-0 flex-1 gap-2">
          <label className="grid gap-1 text-xs">
            <span className="text-muted-foreground">Zoom {f.zoom.toFixed(1)}×</span>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.05}
              value={f.zoom}
              onChange={(e) => set({ ...f, zoom: Number(e.target.value) })}
              className="accent-primary w-full"
            />
          </label>
          <p className="text-muted-foreground text-xs">Geser foto untuk memilih bagian yang tampil. Pratinjau di bentuk lain:</p>
          <div className="flex items-end gap-2">
            {[
              ["aspect-[4/3] w-20", "4:3"],
              ["aspect-video w-24", "16:9"],
            ].map(([box, label]) => (
              <div key={label} className="grid gap-0.5 text-center">
                <div className={cn("bg-muted overflow-hidden rounded border", box)}>
                  <img src={src} alt="" className="size-full object-cover" style={focusStyle(f)} />
                </div>
                <span className="text-muted-foreground text-[10px]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
