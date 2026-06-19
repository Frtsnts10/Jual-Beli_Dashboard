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
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Ringkasan Toko</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Agregasi data real-time dari seluruh aktivitas toko Anda.
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Katalog Produk"
          value={stats.totalProducts}
          icon={<Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description="Total produk aktif di katalog"
          trend="Tersinkronisasi"
        />
        <StatsCard
          title="Total Stok Barang"
          value={stats.totalStock}
          icon={<ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description="Total unit dari seluruh barang"
        />
        <StatsCard
          title="Modal Inventaris"
          value={new Intl.NumberFormat("en-US", { style: "currency", currency: stats.currency }).format(stats.totalValue)}
          icon={<DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description="Total nilai aset cair"
          trend="+3.4% SLA"
        />
        <StatsCard
          title="Total Pelanggan"
          value={stats.totalCustomers}
          icon={<Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          description={`${stats.totalOrders} total penjualan keseluruhan`}
        />
      </div>

      {/* Streaming Accounts Lifecycle Stats Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Status Akun Pelanggan
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Akun Aktif"
            value={stats.activeStreams}
            icon={<CheckCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Akun pelanggan yang sedang aktif"
            trend="Stabil"
          />
          <StatsCard
            title="Akan Kedaluwarsa"
            value={stats.expiringSoonStreams}
            icon={<Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Akan kedaluwarsa dalam waktu ≤ 3 hari"
            trend={stats.expiringSoonStreams > 0 ? "Perlu Tindakan" : "Aman"}
          />
          <StatsCard
            title="Akun Kedaluwarsa"
            value={stats.expiredStreams}
            icon={<AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Akun yang masa aktifnya telah habis"
            trend={stats.expiredStreams > 0 ? "Perlu Diperbarui" : "Bersih"}
          />
          <StatsCard
            title="Pelanggan Diblokir"
            value={stats.bannedCustomers}
            icon={<UserX className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            description="Pelanggan yang melanggar ketentuan"
            trend={stats.bannedCustomers > 0 ? "Dibatasi" : "Bersih"}
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
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">Tiket Keluhan Aktif</span>
            </div>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-100 mb-1">{stats.activeComplaints}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Daftar keluhan pelanggan yang belum diselesaikan atau belum direspons.
            </p>
          </div>

          <div className="p-5 bg-gradient-to-br from-emerald-50 dark:from-emerald-950/20 to-teal-50 dark:to-teal-950/10 rounded-lg border border-emerald-100/60 dark:border-emerald-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wider">Refund Telah Diproses</span>
            </div>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mb-1">{stats.totalRefunds}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Total pengembalian dana atau kompensasi yang telah diberikan kepada pelanggan.
            </p>
          </div>
          <div className="p-5 bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-orange-50 dark:to-orange-950/10 rounded-lg border border-amber-100/60 dark:border-amber-900/40 font-sans transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-950 dark:text-amber-300 uppercase tracking-wider">Keluhan Selesai</span>
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-1">{stats.resolvedComplaints}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Tiket keluhan pelanggan yang telah diselesaikan dengan sukses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
