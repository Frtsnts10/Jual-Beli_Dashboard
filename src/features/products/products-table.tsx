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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Harga</TableHead>
            <TableHead className="text-right">Stok</TableHead>
            <TableHead>Tampil</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">
                {p.title} {p.is_flash_sale && <Badge variant="warning">Flash sale</Badge>}
              </TableCell>
              <TableCell>{p.platform_type}</TableCell>
              <TableCell className="text-right">
                {effectivePrice(p).original ? (
                  <>
                    <span className="text-muted-foreground mr-1 text-xs line-through">{formatIDR(p.price)}</span>
                    {formatIDR(effectivePrice(p).price)}
                  </>
                ) : (
                  formatIDR(p.price)
                )}
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/${storeId}/vault?product=${p.id}`} className={stock[p.id] ? "" : "text-destructive"}>
                  {stock[p.id] ?? 0}
                </Link>
              </TableCell>
              <TableCell>
                <Switch
                  checked={p.is_published}
                  disabled={pending}
                  onCheckedChange={(v) =>
                    start(async () => {
                      const res = await setProductPublished(storeId, p.id, v);
                      if (!res.ok) toast.error(res.error);
                    })
                  }
                />
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
