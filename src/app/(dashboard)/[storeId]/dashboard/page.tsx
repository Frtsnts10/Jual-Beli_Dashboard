import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};


import { getDashboardStats } from "@/features/dashboard/server/get-dashboard-stats";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { ChartCard } from "@/features/dashboard/components/chart-card";
import { SyncButton } from "@/features/dashboard/components/sync-button";
import { Package, Users, DollarSign, AlertCircle, ShoppingCart, CheckCircle, Clock, AlertTriangle, RefreshCw, UserX } from "lucide-react";

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const stats = await getDashboardStats(storeId);

  return (
    <div className="space-y-6 font-sans transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Tenant Telemetry Overview</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live real-time aggregation vector bound to persistent store context memory.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Catalog SKUs"
          value={stats.totalProducts}
          icon={<Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description="Total active catalog items"
          trend="Live synced"
        />
        <StatsCard
          title="Total Stock Count"
          value={stats.totalStock}
          icon={<ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description="Aggregate item unit pools"
        />
        <StatsCard
          title="Inventory Capital"
          value={new Intl.NumberFormat("en-US", { style: "currency", currency: stats.currency }).format(stats.totalValue)}
          icon={<DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description="Liquid asset values"
          trend="+3.4% SLA"
        />
        <StatsCard
          title="Customer Identities"
          value={stats.totalCustomers}
          icon={<Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description={`${stats.totalOrders} total lifetime sales`}
        />
      </div>

      {/* Streaming Accounts Lifecycle Stats Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Subscription Asset Coverage Matrix
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Active Accounts"
            value={stats.activeStreams}
            icon={<CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Fully active operational coverage streams"
            trend="Stable SLA"
          />
          <StatsCard
            title="To Be Expired"
            value={stats.expiringSoonStreams}
            icon={<Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Expiring in ≤ 3 days lifecycle threshold"
            trend={stats.expiringSoonStreams > 0 ? "Action Needed" : "Optimal"}
          />
          <StatsCard
            title="Expired Accounts"
            value={stats.expiredStreams}
            icon={<AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Lapsed duration coverage mapping streams"
            trend={stats.expiredStreams > 0 ? "Requires Renewal" : "Clean Pool"}
          />
          <StatsCard
            title="Banned Customers"
            value={stats.bannedCustomers}
            icon={<UserX className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Violation mitigation subsets"
            trend={stats.bannedCustomers > 0 ? "Restricted" : "Clean Pool"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard data={stats.chartData} />
        </div>
        <div className="space-y-4">
          <div className="p-5 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/20 to-violet-50 dark:to-violet-950/10 rounded-lg border border-indigo-100/60 dark:border-indigo-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">Incident Stream Matrix</span>
            </div>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100 mb-1">{stats.activeComplaints}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Active SLA compliance pending response tickets mapped in workspace stream.
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/20 to-teal-50 dark:to-teal-950/10 rounded-lg border border-emerald-100/60 dark:border-emerald-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">Refund Mitigations Processed</span>
            </div>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mb-1">{stats.totalRefunds}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Granted satisfaction claims resolved via custom billing reimbursements.
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-orange-50 dark:to-orange-950/10 rounded-lg border border-amber-100/60 dark:border-amber-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wider">Resolved Support Tickets</span>
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-1">{stats.resolvedComplaints}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Successfully closed tickets mapping to optimal user satisfaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
