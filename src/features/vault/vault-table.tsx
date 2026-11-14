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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Password</TableHead>
            <TableHead>PIN</TableHead>
            <TableHead>Kedaluwarsa</TableHead>
            <TableHead>Pesanan</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => {
            const show = revealed.has(c.id);
            return (
              <TableRow key={c.id}>
                <TableCell className="max-w-48 truncate">{productTitles[c.product_id] ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">{c.account_email}</TableCell>
                <TableCell className="font-mono text-xs">
                  <button type="button" className="inline-flex items-center gap-1" onClick={() => toggle(c.id)}>
                    {show ? c.account_password : "••••••••"}
                    {show ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                  </button>
                </TableCell>
                <TableCell className="font-mono text-xs">{c.profile_pin ? (show ? c.profile_pin : "••••") : "—"}</TableCell>
                <TableCell>{formatDate(c.expiry_date)}</TableCell>
                <TableCell className="font-mono text-xs">{c.order_id ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {c.status === "AVAILABLE" && (
                    <Button variant="ghost" size="icon" title="Tandai kedaluwarsa" disabled={pending} onClick={() => run(() => expireCredential(storeId, c.id), "Ditandai kedaluwarsa")}>
                      <Ban />
                    </Button>
                  )}
                  {c.status !== "SOLD" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Hapus"
                      disabled={pending}
                      onClick={() => confirm("Hapus akun ini dari brankas?") && run(() => deleteCredential(storeId, c.id), "Dihapus")}
                    >
                      <Trash2 />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
