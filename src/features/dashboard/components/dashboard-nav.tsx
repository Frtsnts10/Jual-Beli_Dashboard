"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  MessageSquareWarning, 
  CreditCard, 
  Settings, 
  X,
  GitPullRequest,
  MonitorPlay
} from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function DashboardNav() {
  const params = useParams();
  const pathname = usePathname();
  const storeId = params?.storeId as string;
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { t } = useI18n();

  React.useEffect(() => {
    setMounted(true);
    
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-mobile-nav", handleToggle);
    
    return () => {
      window.removeEventListener("toggle-mobile-nav", handleToggle);
    };
  }, []);

  if (!storeId) return null;

  const routes = [
    { name: t.sidebar.overview, href: `/${storeId}/dashboard`, icon: LayoutDashboard },
    { name: t.sidebar.orders, href: `/${storeId}/orders`, icon: ShoppingCart },
    { name: t.sidebar.inventory, href: `/${storeId}/inventory`, icon: Package },
    { name: (t.sidebar as any).approvals || "Approvals Desk", href: `/${storeId}/approvals`, icon: GitPullRequest },
    { name: t.sidebar.customers, href: `/${storeId}/customers`, icon: Users },
    { name: t.sidebar.complaints, href: `/${storeId}/complaints`, icon: MessageSquareWarning },
    { name: t.sidebar.billing, href: `/${storeId}/subscription`, icon: CreditCard },
    { name: t.sidebar.settings, href: `/${storeId}/settings`, icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="w-64 h-full overflow-y-auto border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0b0f19] flex flex-col shrink-0 hidden md:block font-sans transition-colors antialiased">
        <div className="flex-1 px-4 py-6 space-y-1.5">
          <div className="mb-4 px-3">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
              {t.sidebar.coreModules}
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
                className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/20 dark:shadow-none animate-in zoom-in-95 duration-150"
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
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-100 dark:border-slate-800/60">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{t.sidebar.status}</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{t.sidebar.liveSync}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Slide-Over Menu Overlay for Mobile/Tablet */}
      {mounted && (
        <div className={`md:hidden fixed inset-0 z-[9998] flex transition-all duration-300 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}>
          {/* Backdrop */}
          <div 
            onClick={() => setIsOpen(false)}
            className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-out ${
              isOpen ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* Drawer Panel */}
          <div className={`relative w-72 h-full bg-white dark:bg-[#0b0f19] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col p-6 space-y-6 shadow-2xl z-[9999] transition-transform duration-300 ease-in-out transform rounded-r-2xl ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.sidebar.console}</p>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 mt-0.5">{t.sidebar.activeModules}</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className="mb-4 px-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  {t.sidebar.mobileGateway}
                </p>
              </div>

              {routes.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.href || (pathname?.startsWith(route.href) && route.href !== `/${storeId}/dashboard`);

                return (
                  <Link
                    key={route.name}
                    href={route.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/20"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-indigo-600 dark:hover:text-indigo-400"
                    }`}
                  >
                    <Icon 
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500 dark:text-slate-500"
                      }`} 
                      strokeWidth={isActive ? 3 : 2.5}
                    />
                    <span>{route.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3 border border-slate-100 dark:border-slate-800/60 flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.sidebar.telemetry}</p>
                  <p className="text-[10px] font-bold text-slate-650 dark:text-slate-350">{t.sidebar.mobileSession}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
