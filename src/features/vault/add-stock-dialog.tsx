"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_STOCK_CONFIG, lineFormat, parseStockLines, type StockConfig } from "@/lib/stock-config";
import { addCredentials } from "./actions";

const NOUN = { account: "akun", code: "kode", link: "link" } as const;

/** An example line built from the product's own fields. */
function example(config: StockConfig) {
  const sample: Record<string, string> = { email: "akun1@mail.com", password: "rahasia123", pin: "1234", kode: "ABCD-EFGH-1234", link: "https://contoh.com/invite/abc" };
  return config.fields.map((f) => sample[f.key] ?? (f.secret ? "rahasia" : f.label.toLowerCase())).join("|") + "|2026-12-31";
}

export function AddStockDialog({
  storeId,
  products,
  defaultProductId,
}: {
  storeId: string;
  products: { id: string; title: string; config: StockConfig }[];
  defaultProductId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(defaultProductId ?? products[0]?.id ?? "");
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const config = products.find((p) => p.id === productId)?.config ?? DEFAULT_STOCK_CONFIG;
  const lines = parseStockLines(text, config);
  const noun = NOUN[config.type];
  const optional = config.fields.filter((f) => !f.required).map((f) => f.label);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={products.length === 0}>
          <Plus /> Tambah stok
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah stok</DialogTitle>
          <DialogDescription>
            Satu {noun} per baris dengan format <code className="text-foreground break-all">{lineFormat(config)}</code>.{" "}
            {optional.length > 0 && <>{optional.join(", ")} boleh dikosongkan. </>}Tanggal kedaluwarsa boleh dikosongkan.
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
            {config.slots > 1 && (
              <p className="text-muted-foreground text-xs">
                Akun sharing: setiap baris dijual ke {config.slots} pembeli, jadi {lines.length || 1} baris = {(lines.length || 1) * config.slots} stok.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lines">Daftar {noun}</Label>
            <Textarea
              id="lines"
              rows={8}
              className="font-mono text-xs"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={example(config)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={pending || !productId || lines.length === 0}
            onClick={() =>
              start(async () => {
                const res = await addCredentials(storeId, productId, lines);
                if (!res.ok) return void toast.error(res.error);
                toast.success(`${res.data?.added} ${noun} ditambahkan`);
                setText("");
                setOpen(false);
              })
            }
          >
            {pending ? "Menyimpan…" : `Simpan ${lines.length || ""} ${noun}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
