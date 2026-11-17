import Link from "next/link";
import { requireStore } from "@/lib/access/auth";
import { listUserTickets } from "@/lib/data/support";
import { paginate } from "@/lib/paging";
import { categoryLabel } from "@/lib/support";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Pager } from "@/components/pager";
import { NewTicketDialog } from "@/features/support/new-ticket-dialog";
import { StatusBadge } from "@/features/support/thread";

export const metadata = { title: "Bantuan" };

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string; size?: string }>;
}) {
  const { storeId } = await params;
  const { user } = await requireStore(storeId);
  const tickets = await listUserTickets(user.uid);
  const { rows, ...pager } = paginate(tickets, await searchParams, 10);

  return (
    <>
      <PageHeader
        title="Bantuan"
        description="Laporkan bug atau tanya admin platform. Balasan muncul di sini dan di lonceng notifikasi."
      >
        <NewTicketDialog storeId={storeId} />
      </PageHeader>
      {tickets.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Belum ada laporan. Ada kendala? Klik “Laporan baru”.
        </p>
      ) : (
        <>
          <div className="divide-y rounded-lg border">
            {rows.map((t) => (
              <Link
                key={t.id}
                href={`/${storeId}/support/${t.id}`}
                className="hover:bg-muted/50 flex items-center justify-between gap-3 p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate font-medium">
                    {t.unread_by_user && (
                      <span
                        className="size-2 shrink-0 rounded-md bg-red-500"
                        aria-label="Ada balasan baru"
                      />
                    )}
                    <span className="truncate">{t.subject}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {categoryLabel(t.category)} · diperbarui{" "}
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
