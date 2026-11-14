"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addCredentials, type CredentialLine } from "./actions";

function parseLines(text: string): CredentialLine[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [account_email = "", account_password = "", profile_pin = "", expiry_date = ""] = line.split("|").map((p) => p.trim());
      return { account_email, account_password, profile_pin, expiry_date };
    });
}

export function AddStockDialog({ storeId, products, defaultProductId }: { storeId: string; products: { id: string; title: string }[]; defaultProductId?: string }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(defaultProductId ?? products[0]?.id ?? "");
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const count = parseLines(text).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={products.length === 0}>
          <Plus /> Tambah stok
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah stok akun</DialogTitle>
          <DialogDescription>
            Satu akun per baris dengan format <code className="text-foreground">email|password|pin|YYYY-MM-DD</code>. PIN dan tanggal kedaluwarsa boleh dikosongkan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Produk</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih produk" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lines">Daftar akun</Label>
            <Textarea
              id="lines"
              rows={8}
              className="font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"akun1@mail.com|rahasia123|1234|2026-12-31\nakun2@mail.com|rahasia456"}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !productId || count === 0}
            onClick={() =>
              start(async () => {
                const res = await addCredentials(storeId, productId, parseLines(text));
                if (!res.ok) return void toast.error(res.error);
                toast.success(`${res.data?.added} akun ditambahkan`);
                setText("");
                setOpen(false);
              })
            }
          >
            {pending ? "Menyimpan…" : `Simpan ${count || ""} akun`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
