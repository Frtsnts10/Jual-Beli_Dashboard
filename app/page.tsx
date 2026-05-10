"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Users,
  CheckCircle,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Package,
  DollarSign,
  Target,
  Calendar,
  Clock
} from "lucide-react";
import { subscribeToInventory, type InventoryItem } from "@/lib/supabase/inventory";
import { subscribeToSubscriptions, type Subscription } from "@/lib/supabase/subscriptions";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { activeShop } = useSettings();
  const currency = activeShop?.currency || "IDR";

  useEffect(() => {
    setIsMounted(true);
    if (!activeShop?.id) return;

    const unsubInv = subscribeToInventory(activeShop.id, setInventory);
    const unsubSubs = subscribeToSubscriptions(activeShop.id, setSubs);
    return () => {
      unsubInv();
      unsubSubs();
    };
  }, [activeShop?.id]);

  // Basic Stats
  const totalStock = inventory.length;
  const available = inventory.filter((a) => a.status === "Tersedia").length;
  
  // Subscription Stats
  const activeSubs = useMemo(() => subs.filter(s => {
    if (!s.expiry_date) return true;
    return new Date(s.expiry_date) > new Date();
  }), [subs]);

  const expiringSoon = useMemo(() => subs.filter(s => {
    if (!s.expiry_date) return false;
    const exp = new Date(s.expiry_date);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7; // Expiring in 7 days
  }), [subs]);

  const expiredSubs = subs.filter(s => s.expiry_date && new Date(s.expiry_date) <= new Date());

  // Financial Stats
  const totalRevenue = useMemo(() => {
    return subs.reduce((sum, s) => sum + (Number(s.selling_price) || 0), 0);
  }, [subs]);

  const totalCost = useMemo(() => {
    return subs.reduce((sum, s) => sum + (Number(s.inventory?.capital_cost) || 0), 0);
  }, [subs]);

  const totalProfit = totalRevenue - totalCost;

  const stats = [
    {
      label: "Total Pemasukan",
      value: formatCurrency(totalRevenue, currency),
      icon: TrendingUp,
      iconClass: "stat-icon-green",
      subValue: "Total omzet penjualan"
    },
    {
      label: "Keuntungan Bersih",
      value: formatCurrency(totalProfit, currency),
      icon: DollarSign,
      iconClass: "stat-icon-blue",
      subValue: `Margin: ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%`
    },
    {
      label: "Stok Tersedia",
      value: available,
      icon: Package,
      iconClass: "stat-icon-purple",
      subValue: `Dari total ${totalStock} item`
    },
    {
      label: "Pelanggan Aktif",
      value: activeSubs.length,
      icon: Users,
      iconClass: "stat-icon-amber",
      subValue: `${expiringSoon.length} akan expired`
    },
  ];

  const recentActivity = subs.slice(0, 8);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Ringkasan operasional dan performa finansial tokomu.
        </p>
      </div>

      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.iconClass}`}>
                <s.icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value" style={{ fontSize: s.value.toString().length > 12 ? "18px" : "22px" }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.subValue}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Content - Equal Height Containers */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 340px", 
          gap: 24, 
          marginTop: 24,
          alignItems: "stretch" // Ensure equal height
        }}>
          
          {/* Recent Subscriptions */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="glass-card-header">
              <p className="glass-card-title">Langganan Terbaru</p>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {recentActivity.length} entri terbaru
              </span>
            </div>
            <div style={{ flex: 1 }}>
              {recentActivity.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <p className="empty-state-text">Belum ada data langganan</p>
                </div>
              ) : (
                recentActivity.map((sub) => {
                  const isExp = sub.expiry_date && new Date(sub.expiry_date) < new Date();
                  return (
                    <div key={sub.id} className="activity-item">
                      <div className={`activity-dot ${isExp ? "activity-dot-red" : "activity-dot-green"}`} />
                      <div style={{ flex: 1 }}>
                        <p className="activity-text">
                          <strong>{sub.customer_name}</strong> membeli <strong>{sub.inventory?.app_name || "Produk"}</strong>
                        </p>
                        <p className="activity-time">
                          {sub.expiry_date ? `Berakhir: ${new Date(sub.expiry_date).toLocaleDateString("id-ID")}` : "Tanpa expiry"} · {sub.whatsapp_number}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                          {formatCurrency(sub.selling_price || 0, currency)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Side Panel: Financial Summary & Expiry Alerts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Profit Summary */}
            <div className="glass-card" style={{ 
              background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))", 
              border: "1px solid rgba(139,92,246,0.2)",
              height: "fit-content"
            }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Target size={18} style={{ color: "var(--accent-light)" }} />
                  <p style={{ fontSize: 14, fontWeight: 700 }}>Ringkasan Profit</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Modal</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCurrency(totalCost, currency)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Omzet</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{formatCurrency(totalRevenue, currency)}</span>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.1)", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-light)" }}>Net Profit</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-light)" }}>{formatCurrency(totalProfit, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expiry Tracking */}
            <div className="glass-card" style={{ flex: 1 }}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <Clock size={18} style={{ color: "var(--warning)" }} />
                  <p style={{ fontSize: 14, fontWeight: 700 }}>Status Langganan</p>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Aktif & Aman</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--success)" }}>{activeSubs.length - expiringSoon.length}</p>
                  </div>

                  <div style={{ background: "rgba(245,158,11,0.05)", padding: 12, borderRadius: 10, border: "1px solid rgba(245,158,11,0.2)" }}>
                    <p style={{ fontSize: 11, color: "var(--warning)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Akan Expired (7 Hari)</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--warning)" }}>{expiringSoon.length}</p>
                  </div>

                  <div style={{ background: "rgba(239,68,68,0.05)", padding: 12, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
                    <p style={{ fontSize: 11, color: "var(--danger)", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Sudah Expired</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--danger)" }}>{expiredSubs.length}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}
