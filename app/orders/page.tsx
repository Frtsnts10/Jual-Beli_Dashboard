"use client";

import { useEffect, useState, useMemo } from "react";
import { Pagination } from "@heroui/react";
import { Search, ShoppingCart, Clock, Package, User, Calendar } from "lucide-react";
import { subscribeToSubscriptions, type Subscription } from "@/lib/supabase/subscriptions";
import { useSettings } from "@/context/SettingsContext";

export default function OrdersPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const { activeShop } = useSettings();

  useEffect(() => {
    if (!activeShop?.id) { setSubs([]); return; }
    const unsub = subscribeToSubscriptions(activeShop.id, setSubs);
    return unsub;
  }, [activeShop?.id]);

  const filtered = useMemo(() => {
    return subs.filter((s) =>
      s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.inventory?.app_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      s.whatsapp_number.includes(search)
    );
  }, [subs, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [page, filtered]);

  const activeCount = subs.filter(s => s.expiry_date && new Date(s.expiry_date) > new Date()).length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Riwayat Pesanan</h1>
        <p className="page-subtitle">Data transaksi dan hubungan pelanggan dengan produk inventory</p>
      </div>

      <div className="page-content">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue"><ShoppingCart size={20} /></div>
            <div>
              <p className="stat-label">Total Transaksi</p>
              <p className="stat-value">{subs.length}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Seluruh Waktu</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-purple"><Clock size={20} /></div>
            <div>
              <p className="stat-label">Aktif Saat Ini</p>
              <p className="stat-value">{activeCount}</p>
              <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Berlangganan</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Cari pelanggan atau aplikasi..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <span className="table-count">{filtered.length} transaksi</span>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Aplikasi / Akun</th>
                  <th>Tgl Mulai</th>
                  <th>Tgl Habis</th>
                  <th>Plan</th>
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
                ) : paged.map((sub) => {
                  const isExp = sub.expiry_date && new Date(sub.expiry_date) < new Date();
                  return (
                    <tr key={sub.id} className="data-row">
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <User size={14} style={{ color: "#60a5fa" }} />
                          </div>
                          <div>
                            <p className="cell-primary">{sub.customer_name}</p>
                            <p className="cell-secondary">{sub.whatsapp_number}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={14} style={{ color: "#a78bfa" }} />
                          </div>
                          <div>
                            <p className="cell-primary" style={{ fontSize: 13 }}>{sub.inventory?.app_name || "Custom"}</p>
                            <p className="cell-secondary" style={{ fontFamily: "monospace", fontSize: 10 }}>{sub.inventory?.login_email || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-date-row">
                          <Calendar size={11} className="cell-icon" />
                          <span className="cell-date">{sub.start_date || "—"}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${isExp ? "red" : "green"}`}>
                          {sub.expiry_date || "—"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: "var(--text-secondary)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "3px 9px", borderRadius: 20, display: "inline-block" }}>
                          {sub.subscription_plan || "Reguler"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > rowsPerPage && (
            <div className="table-footer">
              <span className="table-count">{filtered.length} transaksi ditemukan</span>
              <Pagination isCompact showControls color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
