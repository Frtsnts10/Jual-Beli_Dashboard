"use client";

import { useState, useTransition } from "react";
import { Ban, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { Credential } from "@/types/schema";
import { deleteCredential, expireCredential } from "./actions";

export function VaultTable({ storeId, items, productTitles }: { storeId: string; items: Credential[]; productTitles: Record<string, string> }) {
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
      {c.status !== "SOLD" && (
        <Button
          variant="ghost"
          size="icon"
          title="Hapus"
          aria-label="Hapus"
          disabled={pending}
          onClick={() => confirm("Hapus akun ini dari brankas?") && run(() => deleteCredential(storeId, c.id), "Dihapus")}
        >
          <Trash2 />
        </Button>
      )}
    </>
  );

  const secret = (c: Credential) => {
    const show = revealed.has(c.id);
    return (
      <button type="button" className="inline-flex items-center gap-1 font-mono text-xs" onClick={() => toggle(c.id)} aria-label={show ? "Sembunyikan" : "Tampilkan password"}>
        {show ? c.account_password : "••••••••"}
        {c.profile_pin && <span className="text-muted-foreground">· PIN {show ? c.profile_pin : "••••"}</span>}
        {show ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </button>
    );
  };

  return (
    <>
      {/* Phone: one card per account. */}
      <div className="grid gap-2 md:hidden">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium">{productTitles[c.product_id] ?? "—"}</div>
                <div className="font-mono text-xs break-all">{c.account_email}</div>
              </div>
              <div className="-mt-1 -mr-1 flex shrink-0">{actions(c)}</div>
            </div>
            <div className="mt-2">{secret(c)}</div>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 text-xs">
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
              <TableHead>Email</TableHead>
              <TableHead>Password / PIN</TableHead>
              <TableHead>Kedaluwarsa</TableHead>
              <TableHead className="hidden xl:table-cell">Pesanan</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="max-w-40 truncate xl:max-w-48">{productTitles[c.product_id] ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {c.account_email}
                  {c.order_id && <div className="text-muted-foreground xl:hidden">{c.order_id}</div>}
                </TableCell>
                <TableCell>{secret(c)}</TableCell>
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
