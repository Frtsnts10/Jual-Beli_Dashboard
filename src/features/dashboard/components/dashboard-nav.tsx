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
    <aside className="w-64 h-full overflow-y-auto border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] p-4 shrink-0 hidden md:block font-sans transition-colors">
      <div className="space-y-1">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname?.startsWith(route.href);

          return (
            <Link
              key={route.name}
              href={route.href}
              prefetch={false}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs font-bold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
              <span>{route.name}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
