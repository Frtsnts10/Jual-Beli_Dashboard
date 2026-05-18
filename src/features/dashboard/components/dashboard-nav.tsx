"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart,
  Users, 
  MessageSquareWarning, 
  Settings, 
  CreditCard,
  X
} from "lucide-react";

const navTranslations = {
  id: {
    coreModules: "Modul Utama",
    overview: "Ikhtisar",
    orders: "Antrean Pesanan",
    inventory: "Inventaris",
    customers: "Pelanggan",
    complaints: "Meja Keluhan",
    billing: "Paket Tagihan",
    settings: "Pengaturan",
    status: "Status",
    liveSync: "Sinkronisasi Shard Langsung",
    console: "Konsol Shard",
    activeModules: "Modul Shard Aktif",
    mobileGateway: "Gerbang Shard Seluler",
    telemetry: "Telemetri",
    mobileSession: "Sesi Seluler Aktif"
  },
  en: {
    coreModules: "Core Modules",
    overview: "Overview",
    orders: "Orders Queue",
    inventory: "Inventory",
    customers: "Customers",
    complaints: "Complaints Desk",
    billing: "Billing Plan",
    settings: "Settings",
    status: "Status",
    liveSync: "Live Shard Sync",
    console: "Shard Console",
    activeModules: "Active Shard Modules",
    mobileGateway: "Mobile Shard Gateway",
    telemetry: "Telemetry",
    mobileSession: "Live Mobile Session"
  },
  es: {
    coreModules: "Módulos Principales",
    overview: "Resumen",
    orders: "Cola de Pedidos",
    inventory: "Inventario",
    customers: "Clientes",
    complaints: "Mesa de Quejas",
    billing: "Plan de Facturación",
    settings: "Configuración",
    status: "Estado",
    liveSync: "Sincronización en Vivo",
    console: "Consola de Shard",
    activeModules: "Módulos de Shard Activos",
    mobileGateway: "Puerta de Enlace Móvil",
    telemetry: "Telemetría",
    mobileSession: "Sesión Móvil en Vivo"
  },
  fr: {
    coreModules: "Modules Principaux",
    overview: "Vue d'ensemble",
    orders: "File d'attente",
    inventory: "Inventaire",
    customers: "Clients",
    complaints: "Bureau des Plaintes",
    billing: "Facturation",
    settings: "Paramètres",
    status: "Statut",
    liveSync: "Synchro Shard en Direct",
    console: "Console Shard",
    activeModules: "Modules Shard Actifs",
    mobileGateway: "Passerelle Shard Mobile",
    telemetry: "Télémétrie",
    mobileSession: "Session Mobile en Direct"
  },
  de: {
    coreModules: "Kernmodule",
    overview: "Übersicht",
    orders: "Bestellwarteschlange",
    inventory: "Inventar",
    customers: "Kunden",
    complaints: "Beschwerdestelle",
    billing: "Abrechnungsplan",
    settings: "Einstellungen",
    status: "Status",
    liveSync: "Live Shard Synchronisierung",
    console: "Shard-Konsole",
    activeModules: "Aktive Shard-Module",
    mobileGateway: "Mobiles Shard-Gateway",
    telemetry: "Telemetrie",
    mobileSession: "Live-Mobile-Sitzung"
  },
  ja: {
    coreModules: "コアモジュール",
    overview: "ダッシュボード",
    orders: "注文管理",
    inventory: "在庫管理",
    customers: "顧客管理",
    complaints: "お問い合わせ対応",
    billing: "請求プラン",
    settings: "設定",
    status: "ステータス",
    liveSync: "リアルタイム同期中",
    console: "シャードコンソール",
    activeModules: "アクティブシャードモジュール",
    mobileGateway: "モバイルシャードゲートウェイ",
    telemetry: "テレメトリ",
    mobileSession: "モバイルセッション稼働中"
  },
  zh: {
    coreModules: "核心模块",
    overview: "控制台主页",
    orders: "订单队列",
    inventory: "库存管理",
    customers: "客户列表",
    complaints: "客户投诉",
    billing: "服务方案",
    settings: "系统设置",
    status: "状态",
    liveSync: "数据实时同步中",
    console: "分片终端控制台",
    activeModules: "活动分片控制模块",
    mobileGateway: "移动端控制台通道",
    telemetry: "数据遥测",
    mobileSession: "移动端会话正常"
  }
};

export function DashboardNav() {
  const params = useParams();
  const pathname = usePathname();
  const storeId = params?.storeId as string;
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<keyof typeof navTranslations>("id");

  React.useEffect(() => {
    setMounted(true);
    
    // Read preference on mount
    const savedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof navTranslations;
    if (navTranslations[savedLang]) {
      setLang(savedLang);
    }

    const handleToggle = () => setIsOpen((prev) => !prev);
    const handleLangChange = () => {
      const updatedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof navTranslations;
      if (navTranslations[updatedLang]) {
        setLang(updatedLang);
      }
    };

    window.addEventListener("toggle-mobile-nav", handleToggle);
    window.addEventListener("dashboard-language-changed", handleLangChange);
    
    return () => {
      window.removeEventListener("toggle-mobile-nav", handleToggle);
      window.removeEventListener("dashboard-language-changed", handleLangChange);
    };
  }, []);

  if (!storeId) return null;

  const t = navTranslations[lang] || navTranslations.id;

  const routes = [
    { name: t.overview, href: `/${storeId}/dashboard`, icon: LayoutDashboard },
    { name: t.orders, href: `/${storeId}/orders`, icon: ShoppingCart },
    { name: t.inventory, href: `/${storeId}/inventory`, icon: Package },
    { name: t.customers, href: `/${storeId}/customers`, icon: Users },
    { name: t.complaints, href: `/${storeId}/complaints`, icon: MessageSquareWarning },
    { name: t.billing, href: `/${storeId}/subscription`, icon: CreditCard },
    { name: t.settings, href: `/${storeId}/settings`, icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="w-64 h-full overflow-y-auto border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0b0f19] flex flex-col shrink-0 hidden md:block font-sans transition-colors antialiased">
        <div className="flex-1 px-4 py-6 space-y-1.5">
          <div className="mb-4 px-3">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
              {t.coreModules}
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
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">{t.status}</p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{t.liveSync}</span>
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
          <div className={`relative w-72 h-full bg-white dark:bg-[#0b0f19] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col p-6 space-y-6 shadow-2xl z-[9999] transition-transform duration-300 ease-in-out transform ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.console}</p>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 mt-0.5">{t.activeModules}</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div className="mb-4 px-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                  {t.mobileGateway}
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
                    className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-[11px] font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md"
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
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-sm p-3 border border-slate-100 dark:border-slate-800/60 flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{t.telemetry}</p>
                  <p className="text-[10px] font-bold text-slate-650 dark:text-slate-350">{t.mobileSession}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
