"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIDR } from "@/lib/utils";
import { effectivePrice, type Product } from "@/types/schema";
import { deleteProduct, setProductPublished } from "./actions";
import { ProductDialog } from "./product-dialog";

const bundleStock = (items: string[], stock: Record<string, number>) => Math.min(...items.map((id) => stock[id] ?? 0));

export function ProductsTable({
  storeId,
  products,
  stock,
  flashSalePricing,
}: {
  storeId: string;
  products: Product[];
  stock: Record<string, number>;
  flashSalePricing: boolean;
}) {
  const [pending, start] = useTransition();

  if (products.length === 0) {
    return <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">Belum ada produk.</p>;
  }

  const price = (p: Product) => {
    const eff = effectivePrice(p);
    return eff.original ? (
      <>
        <span className="text-muted-foreground mr-1 text-xs line-through">{formatIDR(p.price)}</span>
        {formatIDR(eff.price)}
      </>
    ) : (
      formatIDR(p.price)
    );
  };

  const stockLink = (p: Product) =>
    p.bundle_items ? (
      <span className={bundleStock(p.bundle_items, stock) ? "" : "text-destructive"} title="Stok terkecil dari isi bundle">
        {bundleStock(p.bundle_items, stock)}
      </span>
    ) : (
      <Link href={`/${storeId}/vault?product=${p.id}`} className={stock[p.id] ? "" : "text-destructive"}>
        {stock[p.id] ?? 0}
      </Link>
    );

  const publishSwitch = (p: Product) => (
    <Switch
      checked={p.is_published}
      disabled={pending}
      aria-label="Tampilkan di etalase"
      onCheckedChange={(v) =>
        start(async () => {
          const res = await setProductPublished(storeId, p.id, v);
          if (!res.ok) toast.error(res.error);
        })
      }
    />
  );

  const badges = (p: Product) => (
    <>
      {p.is_flash_sale && <Badge variant="warning">Flash sale</Badge>}
      {p.bundle_items && <Badge variant="secondary">Bundle · {p.bundle_items.length} produk</Badge>}
    </>
  );

  const actionsMenu = (p: Product) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Aksi">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ProductDialog
          storeId={storeId}
          product={p}
          flashSalePricing={flashSalePricing}
          bundleCandidates={products.filter((x) => !x.bundle_items).map((x) => ({ id: x.id, title: x.title }))}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil /> Edit
            </DropdownMenuItem>
          }
        />
        <DropdownMenuItem
          className="text-destructive"
          onSelect={() => {
            if (!confirm(`Hapus "${p.title}"?`)) return;
            start(async () => {
              const res = await deleteProduct(storeId, p.id);
              if (res.ok) toast.success("Produk dihapus");
              else toast.error(res.error);
            });
          }}
        >
          <Trash2 /> Hapus
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {/* Phone: one card per product. */}
      <div className="grid gap-2 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium">{p.title}</div>
                <div className="text-muted-foreground text-xs">{p.platform_type}</div>
              </div>
              <div className="-mt-1 -mr-1 shrink-0">{actionsMenu(p)}</div>
            </div>
            {(p.is_flash_sale || p.bundle_items) && <div className="mt-2 flex flex-wrap gap-1.5">{badges(p)}</div>}
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium tabular-nums">{price(p)}</div>
                <div className="text-muted-foreground text-xs">Stok {stockLink(p)}</div>
              </div>
              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                Tampil {publishSwitch(p)}
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* Tablet and up; the category folds under the title below xl. */}
      <div className="hidden rounded-lg border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead className="hidden xl:table-cell">Kategori</TableHead>
              <TableHead className="text-right">Harga</TableHead>
              <TableHead className="text-right">Stok</TableHead>
              <TableHead>Tampil</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium whitespace-normal">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.title} {badges(p)}
                  </div>
                  <div className="text-muted-foreground text-xs font-normal xl:hidden">{p.platform_type}</div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">{p.platform_type}</TableCell>
                <TableCell className="text-right">{price(p)}</TableCell>
                <TableCell className="text-right">{stockLink(p)}</TableCell>
                <TableCell>{publishSwitch(p)}</TableCell>
                <TableCell>{actionsMenu(p)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
