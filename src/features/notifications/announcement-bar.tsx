"use client";

import { useEffect, useState } from "react";
import { Info, TriangleAlert, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  level: "info" | "warning" | "maintenance";
}

const KEY = "dismissed-announcements";
const STYLE = {
  info: ["bg-sky-500/10 text-sky-900 dark:text-sky-100", Info],
  warning: [
    "bg-amber-500/15 text-amber-900 dark:text-amber-100",
    TriangleAlert,
  ],
  maintenance: [
    "bg-violet-500/10 text-violet-900 dark:text-violet-100",
    Wrench,
  ],
} as const;

/** Platform announcements under the header; each can be closed (remembered on this device). */
export function AnnouncementBar({ items }: { items: Announcement[] }) {
  const [hidden, setHidden] = useState<string[] | null>(null);
  useEffect(() => {
    let saved: string[] = [];
    try {
      saved = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {}
    // localStorage is only readable after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(saved);
  }, []);
  if (!hidden) return null;
  const visible = items.filter((a) => !hidden.includes(a.id));
  const close = (id: string) => {
    const next = [...hidden, id].slice(-50);
    setHidden(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };
  return (
    <>
      {visible.map((a) => {
        const [cls, Icon] = STYLE[a.level] ?? STYLE.info;
        return (
          <div
            key={a.id}
            role="status"
            className={cn(
              "flex items-start gap-3 border-b px-4 py-2 text-sm md:px-6",
              cls,
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold">{a.title}</span>
              {a.body && (
                <span className="whitespace-pre-line"> — {a.body}</span>
              )}
            </div>
            <button
              type="button"
              aria-label="Tutup pengumuman"
              onClick={() => close(a.id)}
              className="opacity-70 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </>
  );
}
