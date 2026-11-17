"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAGE_SIZES } from "@/lib/paging";
import { cn } from "@/lib/utils";

/**
 * Table footer: "1–10 dari 47", rows-per-page (5/10/50/100) and prev/next. State lives in the
 * URL (?page=&size=) so server pages can slice with paginate() and links stay shareable.
 */
export function Pager({ page, size, pages, total, className }: { page: number; size: number; pages: number; total: number; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const go = (next: Record<string, string | number>) => {
    const sp = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) sp.set(k, String(v));
    router.replace(`${pathname}?${sp}`, { scroll: false });
  };
  if (total === 0) return null;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 text-sm", className)}>
      <span className="text-muted-foreground tabular-nums">
        {from}–{to} dari {total}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground hidden sm:inline">Baris</span>
        <Select value={String(size)} onValueChange={(v) => go({ size: v, page: 1 })}>
          <SelectTrigger className="w-20" aria-label="Baris per halaman">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => go({ page: page - 1 })}>
          <ChevronLeft />
        </Button>
        <span className="min-w-14 text-center tabular-nums">
          {page} / {pages}
        </span>
        <Button variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={page >= pages} onClick={() => go({ page: page + 1 })}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
