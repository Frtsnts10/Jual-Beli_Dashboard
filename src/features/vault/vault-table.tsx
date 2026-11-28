"use client";

import { useState, useTransition } from "react";
import { Ban, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Credential } from "@/types/schema";
import { DEFAULT_STOCK_CONFIG, entryConfig, type StockConfig } from "@/lib/stock-config";
import { deleteCredential, expireCredential } from "./actions";

export function VaultTable({
  storeId,
  items,
  productTitles,
  configs,
}: {
  storeId: string;
  items: Credential[];
  productTitles: Record<string, string>;
  /** Each product's vault fields (labels, which are secret). */
  configs: Record<string, StockConfig>;
}) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const toggle = (id: string) =>
    setRevealed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) toast.success(success);
      else toast.error(res.error);
    });

  if (items.length === 0) {
    return <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">Kosong.</p>;
  }

  const actions = (c: Credential) => (
    <>
      {c.status === "AVAILABLE" && (
        <Button variant="ghost" size="icon" title="Tandai kedaluwarsa" aria-label="Tandai kedaluwarsa" disabled={pending} onClick={() => run(() => expireCredential(storeId, c.id), "Ditandai kedaluwarsa")}>
          <Ban />
        </Button>
      )}
      {c.status !== "SOLD" && c.slots_used === 0 && (
        <Button
          variant="ghost"
          size="icon"
          title="Hapus"
          aria-label="Hapus"
          disabled={pending}
          onClick={() => confirm("Hapus stok ini dari brankas?") && run(() => deleteCredential(storeId, c.id), "Dihapus")}
        >
          <Trash2 />
        </Button>
      )}
    </>
  );

  const configOf = (c: Credential) => entryConfig(configs[c.product_id] ?? DEFAULT_STOCK_CONFIG, c.values);

  /** Every field of the entry: plain ones as text, secret ones masked until revealed. */
  const fields = (c: Credential) => {
    const show = revealed.has(c.id);
    const cfg = configOf(c);
    const hasSecret = cfg.fields.some((f) => f.secret && c.values[f.key]);
    return (
      <div className="grid gap-0.5 font-mono text-xs">
        {cfg.fields.map((f) =>
          c.values[f.key] ? (
            <div key={f.key} className="flex min-w-0 gap-1.5">
              <span className="text-muted-foreground shrink-0 font-sans">{f.label}</span>
              <span className="break-all">{f.secret && !show ? "••••••" : c.values[f.key]}</span>
            </div>
          ) : null,
        )}
        {hasSecret && (
          <button type="button" className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1 font-sans" onClick={() => toggle(c.id)}>
            {show ? <EyeOff className="size-3" /> : <Eye className="size-3" />} {show ? "Sembunyikan" : "Tampilkan"}
          </button>
        )}
      </div>
    );
  };

  const slots = (c: Credential) =>
    c.slots_total > 1 ? (
      <span className="text-xs whitespace-nowrap">
        {c.slots_used}/{c.slots_total} <span className="text-muted-foreground">terpakai</span>
      </span>
    ) : (
      <span className="text-muted-foreground text-xs">—</span>
    );

  return (
    <>
      {/* Phone: one card per account. */}
      <div className="grid gap-2 md:hidden">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{productTitles[c.product_id] ?? "—"}</div>
              </div>
              <div className="-mt-1 -mr-1 flex shrink-0">{actions(c)}</div>
            </div>
            <div className="mt-2">{fields(c)}</div>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
              {c.slots_total > 1 && <span>Slot {c.slots_used}/{c.slots_total} terpakai</span>}
              <span>Kedaluwarsa {formatDate(c.expiry_date)}</span>
              {c.order_id && <span className="font-mono">{c.order_id}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Tablet and up. */}
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Isi stok</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Kedaluwarsa</TableHead>
              <TableHead className="hidden xl:table-cell">Pesanan</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="max-w-40 truncate xl:max-w-48">{productTitles[c.product_id] ?? "—"}</TableCell>
                <TableCell className="whitespace-normal">
                  {fields(c)}
                  {c.order_id && <div className="text-muted-foreground font-mono text-xs xl:hidden">{c.order_id}</div>}
                </TableCell>
                <TableCell>{slots(c)}</TableCell>
                <TableCell>{formatDate(c.expiry_date)}</TableCell>
                <TableCell className="hidden font-mono text-xs xl:table-cell">{c.order_id ?? "—"}</TableCell>
                <TableCell className="text-right">{actions(c)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
