import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTicket } from "@/lib/data/support";
import { TicketThread } from "@/features/support/thread";

export const metadata = { title: "Laporan" };

export default async function PlatformTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const data = await getTicket((await params).ticketId);
  if (!data) notFound();
  return (
    <>
      <Link
        href="/platform/support"
        className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Bantuan
      </Link>
      <TicketThread
        ticket={data.ticket}
        messages={data.messages}
        viewer="admin"
      />
    </>
  );
}
