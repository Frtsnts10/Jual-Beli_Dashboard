"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Admin section links; the current section is highlighted (Ringkasan only on /platform itself). */
export function PlatformNav({ items, newTickets }: { items: { href: string; label: string }[]; newTickets: number }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto border-t px-4 py-2 text-sm md:mx-0 md:w-auto md:border-0 md:p-0">
      {items.map((n) => {
        const active = n.href === "/platform" ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 shrink-0 items-center rounded-md px-2.5 whitespace-nowrap transition-colors",
              active ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {n.label}
            {n.href === "/platform/support" && newTickets > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">{newTickets}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
