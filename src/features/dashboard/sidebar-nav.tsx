"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, KeyRound, LayoutDashboard, Megaphone, Package, Settings, ShoppingBag, Star, TicketPercent, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNav({ storeId, openClaims, isOwner, className }: { storeId: string; openClaims: number; isOwner: boolean; className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  // In the horizontal (phone/tablet) bar, keep the current page's tab in view.
  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);
  const items = [
    { href: `/${storeId}`, label: "Ringkasan", icon: LayoutDashboard, exact: true },
    { href: `/${storeId}/products`, label: "Produk", icon: Package },
    { href: `/${storeId}/vault`, label: "Brankas Stok", icon: KeyRound },
    { href: `/${storeId}/orders`, label: "Pesanan", icon: ShoppingBag, badge: openClaims },
    { href: `/${storeId}/customers`, label: "Pelanggan", icon: Users },
    { href: `/${storeId}/reviews`, label: "Ulasan", icon: Star },
    { href: `/${storeId}/analytics`, label: "Analitik", icon: BarChart3 },
    { href: `/${storeId}/vouchers`, label: "Voucher", icon: TicketPercent },
    { href: `/${storeId}/marketing`, label: "Marketing", icon: Megaphone },
    ...(isOwner ? [{ href: `/${storeId}/billing`, label: "Langganan", icon: CreditCard }] : []),
    { href: `/${storeId}/settings`, label: "Pengaturan", icon: Settings },
  ];

  return (
    <nav ref={navRef} className={cn("flex gap-1", className)}>
      {items.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
            {!!badge && (
              <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white" title="Klaim garansi menunggu">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
