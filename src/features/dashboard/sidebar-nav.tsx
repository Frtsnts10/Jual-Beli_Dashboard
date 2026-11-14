"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KeyRound, LayoutDashboard, Megaphone, Package, Settings, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNav({ storeId, openClaims, className }: { storeId: string; openClaims: number; className?: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/${storeId}`, label: "Ringkasan", icon: LayoutDashboard, exact: true },
    { href: `/${storeId}/products`, label: "Produk", icon: Package },
    { href: `/${storeId}/vault`, label: "Brankas Stok", icon: KeyRound },
    { href: `/${storeId}/orders`, label: "Pesanan", icon: ShoppingBag, badge: openClaims },
    { href: `/${storeId}/marketing`, label: "Marketing", icon: Megaphone },
    { href: `/${storeId}/settings`, label: "Pengaturan", icon: Settings },
  ];

  return (
    <nav className={cn("flex gap-1", className)}>
      {items.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
