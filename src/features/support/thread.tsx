"use client";

/* eslint-disable @next/next/no-img-element -- screenshots attached to reports */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { compress } from "@/components/image-upload";
import { categoryLabel, TICKET_STATUS, type TicketStatus } from "@/lib/support";
import { cn, formatDate } from "@/lib/utils";
import type { TicketMessage, TicketRow } from "@/lib/data/support";
import { markTicketSeen, replyTicket, setTicketStatus } from "./actions";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const s = TICKET_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

/** Screenshot picker shared by the new-report form and replies (compressed before upload). */
export function AttachImage({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onChange(await compress(f, 1600).catch(() => null));
        }}
      />
      {value ? (
        <span className="relative">
          <img
            src={value}
            alt="Lampiran"
            className="h-16 rounded-md border object-cover"
          />
          <button
            type="button"
            aria-label="Hapus lampiran"
            onClick={() => onChange(null)}
            className="bg-background absolute -top-2 -right-2 rounded-md border p-0.5"
          >
            <X className="size-3" />
          </button>
        </span>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => input.current?.click()}
        >
          <ImagePlus /> Lampirkan screenshot
        </Button>
      )}
    </div>
  );
}

/**
 * One report: messages (user on the left, admin on the right), a reply box, and status
 * controls — all statuses for admins, "Tandai selesai" for the reporter.
 */
export function TicketThread({
  ticket,
  messages,
  viewer,
}: {
  ticket: TicketRow;
  messages: TicketMessage[];
  viewer: "admin" | "user";
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (
      (viewer === "admin" && ticket.unread_by_admin) ||
      (viewer === "user" && ticket.unread_by_user)
    )
      void markTicketSeen(ticket.id, viewer);
  }, [ticket.id, ticket.unread_by_admin, ticket.unread_by_user, viewer]);

  const send = () =>
    start(async () => {
      const res = await replyTicket(ticket.id, text, image);
      if (!res.ok) return void toast.error(res.error);
      setText("");
      setImage(null);
      router.refresh();
    });
  const status = (s: TicketStatus) =>
    start(async () => {
      const res = await setTicketStatus(ticket.id, s);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`Status: ${TICKET_STATUS[s].label}`);
      router.refresh();
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {ticket.subject} <StatusBadge status={ticket.status} />
        </CardTitle>
        <CardDescription className="break-all">
          {categoryLabel(ticket.category)} ·{" "}
          <span className="font-mono">{ticket.id}</span> · dibuat{" "}
          {formatDate(ticket.created_at, true)}
          {viewer === "admin" && (
            <>
              {" "}
              · {ticket.email}
              {ticket.page_url && <> · halaman: {ticket.page_url}</>}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3">
          {messages.map((m) => {
            const mine = (viewer === "admin") === (m.from === "admin");
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-md border p-3 text-sm",
                    mine ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 text-xs",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {m.from === "admin" ? "Admin platform" : m.author} ·{" "}
                    {formatDate(m.created_at, true)}
                  </div>
                  {m.text && (
                    <p className="leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
                      {m.text}
                    </p>
                  )}
                  {m.image && (
                    <a href={m.image} target="_blank" rel="noreferrer">
                      <img
                        src={m.image}
                        alt="Lampiran"
                        className="mt-2 max-h-64 rounded-md border object-contain"
                      />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="grid gap-2 border-t pt-4">
          <Textarea
            rows={3}
            value={text}
            maxLength={4000}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              viewer === "admin"
                ? "Balas ke pengguna…"
                : "Tambahkan info atau balas admin…"
            }
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <AttachImage value={image} onChange={setImage} />
            <div className="flex flex-wrap gap-2">
              {viewer === "admin"
                ? (Object.keys(TICKET_STATUS) as TicketStatus[])
                    .filter((s) => s !== ticket.status)
                    .map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        disabled={pending}
                        onClick={() => status(s)}
                      >
                        Tandai {TICKET_STATUS[s].label.toLowerCase()}
                      </Button>
                    ))
                : ticket.status !== "RESOLVED" && (
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() => status("RESOLVED")}
                    >
                      <CheckCircle2 /> Tandai selesai
                    </Button>
                  )}
              <Button
                disabled={pending || (!text.trim() && !image)}
                onClick={send}
              >
                {pending ? <Loader2 className="animate-spin" /> : <Send />}{" "}
                Kirim
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
