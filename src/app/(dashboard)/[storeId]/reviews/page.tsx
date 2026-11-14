import Link from "next/link";
import { Star } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { listProducts, listReviews } from "@/lib/data/queries";
import { ratingSummary, STARS, type RatingCounts } from "@/lib/rating";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ReviewToggle } from "@/features/reviews/review-toggle";

export const metadata = { title: "Ulasan" };

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "visible", label: "Tampil" },
  { key: "hidden", label: "Disembunyikan" },
  { key: "low", label: "Bintang 1–2" },
] as const;

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex shrink-0" role="img" aria-label={`${value} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("size-4", n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

export default async function ReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ f?: string; p?: string }>;
}) {
  const { storeId } = await params;
  const { f = "all", p } = await searchParams;
  await requireStore(storeId);
  const [reviews, products] = await Promise.all([listReviews(storeId), listProducts(storeId)]);
  const titles = new Map(products.map((x) => [x.id, x.title]));

  const visible = reviews.filter(
    (r) =>
      (!p || r.product_id === p) &&
      (f === "visible" ? !r.hidden : f === "hidden" ? r.hidden : f === "low" ? r.rating <= 2 : true)
  );
  const totals = ratingSummary(
    Object.fromEntries(STARS.map((k) => [k, products.reduce((n, x) => n + x.rating[k], 0)])) as RatingCounts
  );
  const avg = totals.count ? totals.avg.toFixed(1) : "–";
  const rated = products.filter((x) => ratingSummary(x.rating).count > 0);
  const qs = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams(Object.entries({ f, p, ...next }).filter((e): e is [string, string] => !!e[1] && e[1] !== "all"));
    return `?${params}`;
  };

  return (
    <>
      <PageHeader
        title="Ulasan"
        description={`Rating toko ${avg} dari ${totals.count} ulasan yang tampil. Ulasan hanya bisa ditulis pembeli yang login dan pesanannya lunas.`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((x) => (
          <Link
            key={x.key}
            href={qs({ f: x.key })}
            className={cn("rounded-full border px-3 py-1 text-sm", f === x.key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted")}
          >
            {x.label}
          </Link>
        ))}
      </div>
      {rated.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <Link href={qs({ p: undefined })} className={cn("rounded-md border px-2 py-1", !p ? "bg-muted font-medium" : "hover:bg-muted")}>
            Semua produk
          </Link>
          {rated.map((x) => {
            const s = ratingSummary(x.rating);
            return (
              <Link key={x.id} href={qs({ p: x.id })} className={cn("rounded-md border px-2 py-1", p === x.id ? "bg-muted font-medium" : "hover:bg-muted")}>
                {x.title} · ★ {s.avg.toFixed(1)} ({s.count})
              </Link>
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          {reviews.length ? "Tidak ada ulasan untuk filter ini." : "Belum ada ulasan. Pembeli bisa menulisnya dari halaman Akun di website toko setelah pesanan lunas."}
        </p>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 [&>li]:min-w-0">
          {visible.map((r) => (
            <li key={r.id} className={cn("bg-card rounded-lg border p-4 text-sm", r.hidden && "opacity-70")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  <b>{r.name}</b>
                  {r.hidden && <Badge variant="secondary">Disembunyikan</Badge>}
                </div>
                <span className="text-muted-foreground text-xs">{formatDate(r.created_at)}</span>
              </div>
              <p className="text-muted-foreground mt-1 truncate text-xs">
                {titles.get(r.product_id) ?? "Produk dihapus"} · <span className="font-mono">{r.id}</span>
              </p>
              {r.text ? (
                <p className="mt-2 leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">{r.text}</p>
              ) : (
                <p className="text-muted-foreground mt-2 italic">Tanpa komentar</p>
              )}
              <div className="mt-3 flex justify-end">
                <ReviewToggle storeId={storeId} reviewId={r.id} hidden={r.hidden} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
