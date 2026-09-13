"use client";

import React from "react";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { ChartCard } from "@/features/dashboard/components/chart-card";
import { SyncButton } from "@/features/dashboard/components/sync-button";
import { Package, Users, DollarSign, AlertCircle, ShoppingCart, CheckCircle, Clock, AlertTriangle, RefreshCw, UserX } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

export function DashboardClient({ stats }: { stats: any }) {
  const { t } = useI18n();
  const d = t.overview;

  return (
    <div className="space-y-6 font-sans transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-slate-100 tracking-tight">{d.title}</h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
            {d.subtitle}
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title={d.products}
          value={stats.totalProducts}
          icon={<Package className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
          description={d.productsDesc}
          trend={d.trendSync}
        />
        <StatsCard
          title={d.stock}
          value={stats.totalStock}
          icon={<ShoppingCart className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
          description={d.stockDesc}
        />
        <StatsCard
          title={d.customers}
          value={stats.totalCustomers}
          icon={<Users className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
          description={d.customersDesc.replace("{orders}", stats.totalOrders)}
        />
        <StatsCard
          title={d.todayRev}
          value={new Intl.NumberFormat("id-ID", { style: "currency", currency: stats.currency }).format(stats.todayRevenue)}
          icon={<DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          description={d.todayRevDesc}
          trend={d.today}
        />
        <StatsCard
          title={d.monthRev}
          value={new Intl.NumberFormat("id-ID", { style: "currency", currency: stats.currency }).format(stats.thisMonthRevenue)}
          icon={<DollarSign className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
          description={d.monthRevDesc}
          trend={d.thisMonth}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-stone-400 dark:text-slate-500 uppercase tracking-widest">
            {d.statusTitle}
          </span>
          <div className="h-px bg-stone-200 dark:bg-slate-800 flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title={d.active}
            value={stats.activeStreams}
            icon={<CheckCircle className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
            description={d.activeDesc}
            trend={d.stable}
          />
          <StatsCard
            title={d.expiring}
            value={stats.expiringSoonStreams}
            icon={<Clock className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
            description={d.expiringDesc}
            trend={stats.expiringSoonStreams > 0 ? d.actionNeeded : d.safe}
          />
          <StatsCard
            title={d.expired}
            value={stats.expiredStreams}
            icon={<AlertTriangle className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
            description={d.expiredDesc}
            trend={stats.expiredStreams > 0 ? d.renewNeeded : d.clean}
          />
          <StatsCard
            title={d.banned}
            value={stats.bannedCustomers}
            icon={<UserX className="w-4 h-4 text-blue-600 dark:text-indigo-400" />}
            description={d.bannedDesc}
            trend={stats.bannedCustomers > 0 ? d.restricted : d.clean}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard data={stats.chartData} />
        </div>
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-blue-50 dark:from-indigo-950/20 to-violet-50 dark:to-violet-950/10 rounded-lg border border-blue-100/60 dark:border-indigo-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-blue-950 dark:text-indigo-300 uppercase tracking-wider">{d.complaints}</span>
            </div>
            <p className="text-2xl font-black text-blue-900 dark:text-indigo-100 mb-1">{stats.activeComplaints}</p>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 leading-relaxed">
              {d.complaintsDesc}
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/20 to-teal-50 dark:to-teal-950/10 rounded-lg border border-emerald-100/60 dark:border-emerald-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">{d.refunds}</span>
            </div>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mb-1">{stats.totalRefunds}</p>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 leading-relaxed">
              {d.refundsDesc}
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-orange-50 dark:to-orange-950/10 rounded-lg border border-amber-100/60 dark:border-amber-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wider">{d.resolved}</span>
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-1">{stats.resolvedComplaints}</p>
            <p className="text-[10px] text-stone-500 dark:text-slate-400 leading-relaxed">
              {d.resolvedDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
