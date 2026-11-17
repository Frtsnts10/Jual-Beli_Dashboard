import Link from "next/link";
import { listAllTickets } from "@/lib/data/support";
import { paginate } from "@/lib/paging";
import { categoryLabel, TICKET_STATUS, type TicketStatus } from "@/lib/support";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { segment, segmented } from "@/components/segmented";
import { StatusBadge } from "@/features/support/thread";

export const metadata = { title: "Bantuan" };

export default async function PlatformSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; page?: string; size?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.s && sp.s in TICKET_STATUS ? sp.s : undefined) as
    | TicketStatus
    | undefined;
  const all = await listAllTickets();
  const visible = status ? all.filter((t) => t.status === status) : all;
  const { rows, ...pager } = paginate(visible, sp, 10);
  const tabs: [string, string, number][] = [
    ["", "Semua", all.length],
    ...(Object.keys(TICKET_STATUS) as TicketStatus[]).map(
      (k): [string, string, number] => [
        k,
        TICKET_STATUS[k].label,
        all.filter((t) => t.status === k).length,
      ],
    ),
  ];

  return (
    <>
      <PageHeader
        title="Bantuan"
        description="Laporan bug & pertanyaan dari seller. Balasan Anda masuk ke lonceng + push notif mereka."
      />
      <nav className={segmented("mb-4")}>
        {tabs.map(([k, label, n]) => (
          <Link
            key={k || "all"}
            href={k ? `?s=${k}` : "?"}
            className={segment((status ?? "") === k)}
          >
            {label} ({n})
          </Link>
        ))}
      </nav>
      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Tidak ada laporan.
        </p>
      ) : (
        <>
          <div className="divide-y rounded-lg border">
            {rows.map((t) => (
              <Link
                key={t.id}
                href={`/platform/support/${t.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-medium">
                    {t.unread_by_admin && (
                      <span
                        className="size-2 shrink-0 rounded-md bg-red-500"
                        aria-label="Belum dibaca"
                      />
                    )}
                    <span className="truncate">{t.subject}</span>
                  </div>
                  <div className="text-muted-foreground truncate text-xs">
                    {t.email} · {categoryLabel(t.category)} ·{" "}
                    {formatDate(t.updated_at, true)}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </Link>
            ))}
          </div>
          <Pager {...pager} className="mt-4" />
        </>
      )}
    </>
  );
}
