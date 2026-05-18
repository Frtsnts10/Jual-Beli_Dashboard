"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  Users, 
  MessageSquareWarning, 
  Settings, 
  CreditCard 
} from "lucide-react";

export function DashboardNav() {
  const params = useParams();
  const pathname = usePathname();
  const storeId = params?.storeId as string;

  if (!storeId) return null;

  const routes = [
    { name: "Overview", href: `/${storeId}/dashboard`, icon: LayoutDashboard },
    { name: "Orders Queue", href: `/${storeId}/orders`, icon: ShoppingCart },
    { name: "Inventory", href: `/${storeId}/inventory`, icon: Package },
    { name: "Customers", href: `/${storeId}/customers`, icon: Users },
    { name: "Complaints Desk", href: `/${storeId}/complaints`, icon: MessageSquareWarning },
    { name: "Billing Plan", href: `/${storeId}/subscription`, icon: CreditCard },
    { name: "Settings", href: `/${storeId}/settings`, icon: Settings },
  ];

  return (
    <aside className="w-64 h-full overflow-y-auto border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0b0f19] flex flex-col shrink-0 hidden md:block font-sans transition-colors antialiased">
      <div className="flex-1 px-4 py-6 space-y-1.5">
        <div className="mb-4 px-3">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
            Core Modules
          </p>
        </div>
        
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href || (pathname?.startsWith(route.href) && route.href !== `/${storeId}/dashboard`);

          return (
            <Link
              key={route.name}
              href={route.href}
              prefetch={false}
              className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-[11px] font-bold transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/20 dark:shadow-none"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <Icon 
                className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500 dark:text-slate-500"
                }`} 
                strokeWidth={isActive ? 3 : 2.5}
              />
              <span className="truncate">{route.name}</span>
              
              {isActive && (
                <div className="ml-auto w-1 h-1 rounded-full bg-white opacity-60" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800/40">
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-sm p-3 border border-slate-100 dark:border-slate-800/60">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Live Shard Sync</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
