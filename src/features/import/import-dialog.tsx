"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, FileUp, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buildProductRows, buildStockRows, parseCsv, PRODUCT_TEMPLATE, STOCK_TEMPLATE, toCsv, type ProductRow, type StockRow } from "@/lib/import/table";
import { formatIDR } from "@/lib/utils";
import { addCredentials } from "@/features/vault/actions";
import { importProducts } from "@/features/products/actions";

type Kind = "stock" | "products";

async function readTable(file: File): Promise<unknown[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/browser");
    return (await readSheet(file)) as unknown[][];
  }
  return parseCsv(await file.text());
}

function downloadTemplate(kind: Kind) {
  const csv = toCsv(kind === "stock" ? STOCK_TEMPLATE : PRODUCT_TEMPLATE);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: kind === "stock" ? "template-stok.csv" : "template-produk.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * "Impor file": pick a CSV or Excel (.xlsx) file, see every row checked (OK / why not) and
 * import only the valid ones. Stock rows go through addCredentials per product (same plan
 * limits, encryption and restock alerts as typing them in); products through importProducts.
 */
export function ImportDialog({
  storeId,
  kind,
  products = [],
  existingTitles = [],
}: {
  storeId: string;
  kind: Kind;
  products?: { id: string; title: string }[];
  existingTitles?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<(StockRow | ProductRow)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const valid = rows.filter((r) => !r.error);

  const pick = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setRows([]);
    try {
      const table = await readTable(file);
      const res = kind === "stock" ? buildStockRows(table, products) : buildProductRows(table, existingTitles);
      if (res.error) setError(res.error);
      setRows(res.rows);
    } catch {
      setError("File tidak bisa dibaca. Pakai CSV atau Excel (.xlsx).");
    }
  };

  const run = () =>
    start(async () => {
      if (kind === "products") {
        const res = await importProducts(
          storeId,
          (valid as ProductRow[]).map(({ title, platform_type, price, duration_days, description, image_url, is_published }) => ({
            title,
            platform_type,
            price,
            duration_days,
            description,
            image_url,
            is_published,
          }))
        );
        if (!res.ok) return void toast.error(res.error);
        toast.success(`${res.data?.added} produk diimpor`);
      } else {
        const groups = new Map<string, StockRow[]>();
        for (const r of valid as StockRow[]) groups.set(r.productId!, [...(groups.get(r.productId!) ?? []), r]);
        let added = 0;
        for (const [productId, list] of groups) {
          for (let i = 0; i < list.length; i += 400) {
            const res = await addCredentials(
              storeId,
              productId,
              list.slice(i, i + 400).map((r) => ({ account_email: r.email, account_password: r.password, profile_pin: r.pin, expiry_date: r.expiry }))
            );
            if (!res.ok) {
              toast.error(`${list[0].product}: ${res.error}`);
              if (added) toast.success(`${added} akun sudah masuk sebelum error.`);
              router.refresh();
              return;
            }
            added += res.data?.added ?? 0;
          }
        }
        toast.success(`${added} akun diimpor ke Brankas`);
      }
      setOpen(false);
      setRows([]);
      setFileName("");
      router.refresh();
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileUp /> Impor file
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[92svh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{kind === "stock" ? "Impor stok dari file" : "Impor produk dari file"}</DialogTitle>
          <DialogDescription>
            CSV atau Excel (.xlsx), baris pertama berisi judul kolom.{" "}
            {kind === "stock"
              ? "Kolom: produk (judul persis), email, password, pin, kedaluwarsa."
              : "Kolom: judul, kategori, harga, durasi_hari, deskripsi, gambar_url, tampil."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <label className="cursor-pointer">
              <FileUp /> {fileName || "Pilih file"}
              <input type="file" accept=".csv,.xlsx,text/csv" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
          </Button>
          <Button variant="ghost" onClick={() => downloadTemplate(kind)}>
            <Download /> Unduh template
          </Button>
          {rows.length > 0 && (
            <span className="text-muted-foreground ml-auto text-sm">
              <b className="text-foreground">{valid.length}</b> siap · {rows.length - valid.length} dilewati
            </span>
          )}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {rows.length > 0 && (
          <div className="min-h-0 flex-1 overflow-auto rounded-md border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2">Baris</th>
                  <th className="p-2">{kind === "stock" ? "Produk" : "Judul"}</th>
                  <th className="p-2">{kind === "stock" ? "Email" : "Harga"}</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 500).map((r) => (
                  <tr key={r.line} className="border-t">
                    <td className="text-muted-foreground p-2 tabular-nums">{r.line}</td>
                    <td className="max-w-48 truncate p-2">{"product" in r ? r.product : r.title}</td>
                    <td className="max-w-48 truncate p-2">{"email" in r ? r.email : Number.isFinite(r.price) ? formatIDR(r.price) : "—"}</td>
                    <td className="p-2">
                      {r.error ? (
                        <span className="text-destructive inline-flex items-center gap-1">
                          <XCircle className="size-3.5 shrink-0" /> {r.error}
                        </span>
                      ) : (
                        <Badge variant="success">
                          <CheckCircle2 /> OK
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DialogFooter>
          <Button disabled={pending || valid.length === 0} onClick={run}>
            {pending && <Loader2 className="animate-spin" />} Impor {valid.length || ""} baris
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
