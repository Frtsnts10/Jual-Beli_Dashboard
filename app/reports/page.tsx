"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardBody, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Chip
} from "@heroui/react";
import { 
  FileDown, 
  TrendingUp, 
  Users, 
  Package, 
  DollarSign, 
  Calendar,
  Filter
} from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { subscribeToSubscriptions, type Subscription } from "@/lib/supabase/subscriptions";
import { subscribeToInventory, type InventoryItem } from "@/lib/supabase/inventory";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ReportsPage() {
  const { activeShop } = useSettings();
  const currency = activeShop?.currency || "IDR";
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeShop?.id) return;
    setIsLoading(true);
    const unsubSubs = subscribeToSubscriptions(activeShop.id, (data) => {
      setSubs(data);
      setIsLoading(false);
    });
    const unsubInv = subscribeToInventory(activeShop.id, setInventory);
    return () => { unsubSubs(); unsubInv(); };
  }, [activeShop?.id]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalSales = subs.length;
    const totalRevenue = subs.reduce((acc, sub) => acc + (sub.selling_price || 0), 0);
    
    // Profit Calculation (Revenue - Capital Cost of linked inventory)
    const totalProfit = subs.reduce((acc, sub) => {
      const capital = sub.inventory?.capital_cost || 0;
      return acc + ((sub.selling_price || 0) - capital);
    }, 0);

    const activeSubs = subs.filter(s => s.expiry_date ? new Date(s.expiry_date) > new Date() : true).length;
    const inventoryValue = inventory.reduce((acc, item) => acc + (item.capital_cost || 0) * (item.quantity || 0), 0);

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      activeSubs,
      inventoryValue
    };
  }, [subs, inventory]);

  const handleExportReport = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Library Excel belum siap.");
      return;
    }

    const reportData = subs.map(s => ({
      Tanggal: s.start_date || "-",
      Pelanggan: s.customer_name,
      Aplikasi: s.inventory?.app_name || "Mandiri",
      "Harga Jual": s.selling_price || 0,
      "Modal": s.inventory?.capital_cost || 0,
      "Laba": (s.selling_price || 0) - (s.inventory?.capital_cost || 0),
      Status: s.expiry_date ? (new Date(s.expiry_date) > new Date() ? "Aktif" : "Kadaluarsa") : "Aktif"
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");
    XLSX.writeFile(wb, `Laporan_${activeShop?.shop_name || "Toko"}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Laporan berhasil diunduh");
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 className="page-title">Laporan & Statistik</h1>
            <p className="page-subtitle">Ringkasan performa bisnis {activeShop?.shop_name}</p>
          </div>
          <Button 
            onPress={handleExportReport}
            className="bg-purple-600 text-white font-semibold"
            startContent={<FileDown size={18} />}
          >
            Ekspor Laporan
          </Button>
        </div>
      </div>

      <div className="page-content">
        {/* Quick Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <Card className="bg-[#14141e] border-white/[0.08] shadow-xl">
            <CardBody className="p-5">
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div className="stat-icon-purple" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <p className="stat-label">Total Pendapatan</p>
                  <p className="stat-value text-2xl">{formatCurrency(stats.totalRevenue, currency)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-[#14141e] border-white/[0.08] shadow-xl">
            <CardBody className="p-5">
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div className="stat-icon-green" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DollarSign size={22} />
                </div>
                <div>
                  <p className="stat-label">Total Laba Bersih</p>
                  <p className="stat-value text-2xl">{formatCurrency(stats.totalProfit, currency)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-[#14141e] border-white/[0.08] shadow-xl">
            <CardBody className="p-5">
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div className="stat-icon-blue" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={22} />
                </div>
                <div>
                  <p className="stat-label">Pelanggan Aktif</p>
                  <p className="stat-value text-2xl">{stats.activeSubs}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-[#14141e] border-white/[0.08] shadow-xl">
            <CardBody className="p-5">
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div className="stat-icon-amber" style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={22} />
                </div>
                <div>
                  <p className="stat-label">Nilai Inventori</p>
                  <p className="stat-value text-2xl">{formatCurrency(stats.inventoryValue, currency)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* Main Sales Table */}
          <Card className="bg-[#0f0f17] border-white/[0.08] shadow-2xl overflow-hidden">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontWeight: 700, color: "var(--text-primary)" }}>Penjualan Terbaru</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" variant="flat" className="bg-white/5" startContent={<Calendar size={14} />}>30 Hari Terakhir</Button>
              </div>
            </div>
            <Table 
              aria-label="Recent Sales" 
              className="p-0"
              removeWrapper
              classNames={{
                th: "bg-transparent text-gray-400 border-b border-white/5 h-12 px-6",
                td: "px-6 py-4 border-b border-white/[0.02]"
              }}
            >
              <TableHeader>
                <TableColumn>PELANGGAN</TableColumn>
                <TableColumn>PRODUK</TableColumn>
                <TableColumn>HARGA</TableColumn>
                <TableColumn>LABA</TableColumn>
                <TableColumn>STATUS</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Belum ada transaksi">
                {subs.slice(0, 8).map((sub) => {
                  const profit = (sub.selling_price || 0) - (sub.inventory?.capital_cost || 0);
                  const isExp = sub.expiry_date ? new Date(sub.expiry_date) < new Date() : false;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <p style={{ fontWeight: 600 }}>{sub.customer_name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub.whatsapp_number}</p>
                      </TableCell>
                      <TableCell>
                        <p style={{ fontSize: 13 }}>{sub.inventory?.app_name || "Mandiri"}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub.subscription_plan}</p>
                      </TableCell>
                      <TableCell>{formatCurrency(sub.selling_price || 0, currency)}</TableCell>
                      <TableCell>
                        <span style={{ color: profit > 0 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                          {formatCurrency(profit, currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="sm" 
                          variant="flat" 
                          color={isExp ? "danger" : "success"}
                          className="font-semibold"
                        >
                          {isExp ? "Expired" : "Active"}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Performance Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card className="bg-[#0f0f17] border-white/[0.08] shadow-2xl p-6">
              <h3 style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Ringkasan Produk</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {inventory.slice(0, 5).map(item => {
                  const soldCount = subs.filter(s => s.inventory_id === item.id).length;
                  const totalRevenue = subs.filter(s => s.inventory_id === item.id).reduce((acc, s) => acc + (s.selling_price || 0), 0);
                  return (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600 }}>{item.app_name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{soldCount} terjual • {item.quantity} stok</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-light)" }}>{formatCurrency(totalRevenue, currency)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-white/[0.1] shadow-2xl p-6">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontWeight: 700, color: "white" }}>Target Penjualan</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>Bulan ini</p>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", padding: 8, borderRadius: 10 }}>
                  <TrendingUp size={16} className="text-white" />
                </div>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ height: "100%", width: "75%", background: "linear-gradient(90deg, #a78bfa, #60a5fa)", borderRadius: 4 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "white" }}>75% Tercapai</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{stats.totalSales} / 100</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
