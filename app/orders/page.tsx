"use client";

import { useEffect, useState, useMemo } from "react";
import { Input, Pagination } from "@heroui/react";
import { Search, ShoppingCart, Calendar, CreditCard } from "lucide-react";
import { subscribeToSubscriptions, type Subscription } from "@/lib/supabase/subscriptions";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const { activeShop } = useSettings();

  useEffect(() => {
    if (!activeShop?.id) {
      setSubs([]);
      return;
    }
    const unsub = subscribeToSubscriptions(activeShop.id, setSubs);
    return unsub;
  }, [activeShop?.id]);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      const matchSearch =
        s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.inventory?.app_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        s.whatsapp_number.includes(search);
      return matchSearch;
    });
  }, [subs, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, filtered]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Riwayat Pesanan</h1>
        <p className="page-subtitle">
          Data transaksi dan hubungan pelanggan dengan produk inventory
        </p>
      </div>

      <div className="page-content">
        {/* Summary Stats */}
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">
              <ShoppingCart size={20} />
            </div>
            <div>
              <p className="stat-label">Total Transaksi</p>
              <p className="stat-value">{subs.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">
              <Calendar size={20} />
            </div>
            <div>
              <p className="stat-label">Aktif / Total</p>
              <p className="stat-value">
                {subs.filter(s => s.expiry_date && new Date(s.expiry_date) > new Date()).length} / {subs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="glass-card-header">
            <p className="glass-card-title">Log Transaksi</p>
            <Input
              placeholder="Cari pelanggan atau aplikasi..."
              value={search}
              onValueChange={(v) => { setSearch(v); setPage(1); }}
              startContent={<Search size={15} className="text-gray-400" />}
              size="sm"
              variant="bordered"
              classNames={{ 
                inputWrapper: "login-input-wrapper table-search-wrapper", 
                base: "max-w-xs" 
              }}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Pelanggan", "Aplikasi / Akun", "Tgl Mulai", "Tgl Habis", "Plan"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📄</div>
                        <p className="empty-state-text">Belum ada riwayat pesanan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paged.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                      <td style={{ padding: "13px 16px" }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{sub.customer_name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub.whatsapp_number}</p>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                          {sub.inventory?.app_name || "Custom"}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {sub.inventory?.login_email || "No Account Info"}
                        </p>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12.5, color: "var(--text-secondary)" }}>
                        {sub.start_date || "-"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span className={`badge ${sub.expiry_date && new Date(sub.expiry_date) < new Date() ? "badge-expired" : "badge-sold"}`}>
                          {sub.expiry_date || "-"}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-secondary)" }}>
                        {sub.subscription_plan || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > rowsPerPage && (
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{filtered.length} transaksi ditemukan</span>
              <Pagination isCompact showControls color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
