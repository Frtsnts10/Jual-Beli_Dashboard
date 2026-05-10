"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@heroui/react";
import { Save, Store, Globe, ShieldCheck, ListChecks, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { updateShopSettings, deleteShop } from "@/lib/supabase/shop_settings";

/** Dynamic currency list — Intl API, no hardcoded array */
function useAllCurrencies() {
  return useMemo(() => {
    try {
      const codes = (Intl as any).supportedValuesOf("currency") as string[];
      const names = new Intl.DisplayNames(["id"], { type: "currency" });
      return codes.map((code: string) => ({ code, name: names.of(code) || code }));
    } catch {
      return [
        { code: "IDR", name: "Rupiah Indonesia" }, { code: "USD", name: "Dolar AS" },
        { code: "EUR", name: "Euro" }, { code: "GBP", name: "Pound Britania" },
        { code: "SGD", name: "Dolar Singapura" }, { code: "MYR", name: "Ringgit Malaysia" },
        { code: "JPY", name: "Yen Jepang" },
      ];
    }
  }, []);
}

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="form-field">
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export default function SettingsPage() {
  const { activeShop, refreshShops, shops, setActiveShopId } = useSettings();

  const currencies = useAllCurrencies();
  const [storeName, setStoreName] = useState("");
  const [waNumber, setWaNumber]   = useState("");
  const [currency, setCurrency]   = useState("IDR");
  const [isSaving, setIsSaving]   = useState(false);

  useEffect(() => {
    if (activeShop) {
      setStoreName(activeShop.shop_name);
      setWaNumber(activeShop.whatsapp_number || "");
      setCurrency(activeShop.currency || "IDR");
    } else {
      setStoreName(""); setWaNumber(""); setCurrency("IDR");
    }
  }, [activeShop]);

  const handleSave = async () => {
    if (!activeShop) return;
    setIsSaving(true);
    try {
      await updateShopSettings(activeShop.id, { shop_name: storeName, whatsapp_number: waNumber, currency });
      await refreshShops();
      toast.success("Pengaturan toko berhasil diperbarui!");
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally { setIsSaving(false); }
  };

  const handleDeleteShop = async (id: string, name: string) => {
    if (shops.length <= 1) { toast.error("Anda harus memiliki setidaknya satu toko."); return; }
    if (!confirm(`Hapus toko "${name}" beserta seluruh datanya? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteShop(id);
      await refreshShops();
      toast.success("Toko berhasil dihapus.");
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Pengaturan Toko</h1>
        <p className="page-subtitle">Konfigurasi profil dan preferensi operasional</p>
      </div>

      <div className="page-content">
        {!activeShop ? (
          <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Store size={28} style={{ color: "var(--text-muted)" }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>Belum Ada Toko Terpilih</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Silakan pilih toko dari sidebar.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 24, alignItems: "start" }}>

            {/* Left: Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Identitas */}
              <div className="glass-card">
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.015)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShieldCheck size={16} style={{ color: "#60a5fa" }} />
                  </div>
                  <p className="glass-card-title">Identitas & Kontak</p>
                </div>
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <FormField label="Nama Toko">
                    <input
                      className="form-input"
                      placeholder="cth. My Digital Shop"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                    />
                  </FormField>
                  <FormField label="WhatsApp Admin">
                    <input
                      className="form-input"
                      placeholder="cth. 628123456789"
                      value={waNumber}
                      onChange={e => setWaNumber(e.target.value)}
                    />
                  </FormField>
                </div>
              </div>

              {/* Currency */}
              <div className="glass-card">
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.015)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Globe size={16} style={{ color: "#34d399" }} />
                  </div>
                  <p className="glass-card-title">Mata Uang & Regional</p>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <FormField label="Mata Uang">
                    <select
                      className="form-input form-select"
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                    >
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                      ))}
                    </select>
                  </FormField>
                  <p style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.6 }}>
                    * Perubahan mata uang mempengaruhi tampilan nominal di seluruh halaman dashboard.
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <Button
                isLoading={isSaving}
                onPress={handleSave}
                startContent={<Save size={18} />}
                style={{
                  height: 52,
                  background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 14,
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(139,92,246,0.3)"
                }}
              >
                Simpan Perubahan
              </Button>
            </div>

            {/* Right: Shop List */}
            <div className="glass-card">
              <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.015)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ListChecks size={16} style={{ color: "#a78bfa" }} />
                </div>
                <p className="glass-card-title">Daftar Toko Anda</p>
              </div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {shops.map(s => (
                  <div
                    key={s.id}
                    className="settings-shop-item"
                    style={{
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: s.id === activeShop.id ? "rgba(139,92,246,0.07)" : "rgba(255,255,255,0.02)",
                      border: s.id === activeShop.id ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      cursor: s.id !== activeShop.id ? "pointer" : "default",
                      transition: "all 0.15s",
                    }}
                    onClick={() => s.id !== activeShop.id && setActiveShopId(s.id)}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 9,
                      background: s.id === activeShop.id ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${s.id === activeShop.id ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.08)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <Store size={16} style={{ color: s.id === activeShop.id ? "#a78bfa" : "var(--text-muted)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: s.id === activeShop.id ? "#c4b5fd" : "var(--text-primary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.shop_name}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0" }}>
                        {s.currency} · {s.whatsapp_number || "No WA"}
                      </p>
                    </div>
                    {s.id === activeShop.id ? (
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)", padding: "2px 7px", borderRadius: 4, flexShrink: 0 }}>
                        Aktif
                      </span>
                    ) : (
                      <button
                        className="action-btn danger"
                        onClick={(e) => { e.stopPropagation(); handleDeleteShop(s.id, s.shop_name); }}
                        style={{ flexShrink: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}
