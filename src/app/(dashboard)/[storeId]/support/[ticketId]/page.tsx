import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStore } from "@/lib/access/auth";
import { getTicket } from "@/lib/data/support";
import { TicketThread } from "@/features/support/thread";

export const metadata = { title: "Laporan" };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ storeId: string; ticketId: string }>;
}) {
  const { storeId, ticketId } = await params;
  const { user } = await requireStore(storeId);
  const data = await getTicket(ticketId);
  if (!data || data.ticket.uid !== user.uid) notFound();
  return (
    <>
      <Link
        href={`/${storeId}/support`}
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Bantuan
      </Link>
      <TicketThread
        ticket={data.ticket}
        messages={data.messages}
        viewer="user"
      />
    </>
  );
}
