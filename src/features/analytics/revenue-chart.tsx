import { formatIDR } from "@/lib/utils";

/** Dependency-free SVG bar chart of daily paid revenue (server-rendered). */
export function RevenueChart({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  const labelEvery = Math.ceil(data.length / 8);
  return (
    <div>
      <div className="relative h-48">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Pendapatan harian">
          {data.map((d, i) => {
            const h = (d.value / max) * 100;
            return (
              <rect key={d.day} x={i * w + w * 0.15} y={100 - h} width={w * 0.7} height={h} className="fill-primary/80">
                <title>{`${d.day}: ${formatIDR(d.value)}`}</title>
              </rect>
            );
          })}
        </svg>
        <span className="text-muted-foreground absolute top-0 left-0 text-xs">{formatIDR(max)}</span>
      </div>
      <div className="text-muted-foreground mt-1 flex justify-between text-[10px]">
        {data.map((d, i) => (i % labelEvery === 0 ? <span key={d.day}>{d.day.slice(5)}</span> : null))}
      </div>
    </div>
  );
}
