"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { LayoutDashboard, Package, Users, MessageSquareWarning, Settings, CreditCard } from "lucide-react";

export function DashboardNav() {
  const params = useParams();
  const pathname = usePathname();
  const storeId = params?.storeId as string;

  if (!storeId) return null;

  const routes = [
    { name: "Overview", href: `/${storeId}/dashboard`, icon: LayoutDashboard },
    { name: "Inventory", href: `/${storeId}/inventory`, icon: Package },
    { name: "Customers", href: `/${storeId}/customers`, icon: Users },
    { name: "Complaints Desk", href: `/${storeId}/complaints`, icon: MessageSquareWarning },
    { name: "Billing Plan", href: `/${storeId}/subscription`, icon: CreditCard },
    { name: "Settings", href: `/${storeId}/settings`, icon: Settings },
  ];

  return (
    <aside className="w-64 h-full overflow-y-auto border-r border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0b0f19]/60 backdrop-blur-md p-4 shrink-0 hidden md:block font-sans transition-colors">
      <div className="space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname?.startsWith(route.href);

          return (
            <Link
              key={route.name}
              href={route.href}
              prefetch={false}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-bold transition-all relative z-10 ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
              <span>{route.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
