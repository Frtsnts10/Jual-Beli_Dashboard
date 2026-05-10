"use client";

import { useState, useEffect } from "react";
import { Input, Button, Select, SelectItem, Card, CardBody } from "@heroui/react";
import { Save, Store, Phone, DollarSign, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { updateShopSettings, createShop } from "@/lib/supabase/shop_settings";

const ALL_CURRENCIES = [
  { code: "IDR", name: "Rupiah Indonesia", symbol: "Rp" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
];

export default function SettingsPage() {
  const { activeShop, refreshShops, shops } = useSettings();
  
  const [storeName, setStoreName] = useState("");
  const [waNumber, setWaNumber] = useState("");
  const [currency, setCurrency] = useState("IDR");
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Sync state when activeShop changes
  useEffect(() => {
    if (activeShop) {
      setStoreName(activeShop.shop_name);
      setWaNumber(activeShop.whatsapp_number || "");
      setCurrency(activeShop.currency || "IDR");
    } else {
      setStoreName("");
      setWaNumber("");
      setCurrency("IDR");
    }
  }, [activeShop]);

  const handleSave = async () => {
    if (!activeShop) return;
    setIsSaving(true);
    try {
      await updateShopSettings(activeShop.id, {
        shop_name: storeName,
        whatsapp_number: waNumber,
        currency: currency
      });
      await refreshShops();
      toast.success("Pengaturan toko berhasil diperbarui!");
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNew = async () => {
    setIsAdding(true);
    try {
      await createShop({
        shop_name: "Toko Baru",
        whatsapp_number: "",
        currency: "IDR"
      });
      await refreshShops();
      toast.success("Toko baru berhasil ditambahkan!");
    } catch (err: any) {
      toast.error("Gagal menambahkan toko: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Pengaturan Toko</h1>
          <p className="page-subtitle">Kelola informasi dan preferensi untuk {activeShop?.shop_name || "toko Anda"}</p>
        </div>
        <Button 
          onPress={handleAddNew} 
          isLoading={isAdding}
          startContent={<Plus size={18} />}
          variant="flat"
          className="bg-white/5 border border-white/10 hover:bg-white/10"
        >
          Tambah Toko Baru
        </Button>
      </div>

      <div className="page-content">
        {!activeShop ? (
          <div className="glass-card" style={{ padding: 40, textAlign: "center" }}>
            <p className="text-gray-400">Belum ada toko yang dipilih atau dibuat.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="glass-card">
                <div className="glass-card-header">
                  <p className="glass-card-title">Identitas Toko</p>
                </div>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                  <Input
                    label="Nama Toko"
                    value={storeName}
                    onValueChange={setStoreName}
                    startContent={<Store size={16} className="text-gray-500" />}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Input
                    label="WhatsApp Admin"
                    placeholder="628xxxxxxxxxx"
                    value={waNumber}
                    onValueChange={setWaNumber}
                    startContent={<Phone size={16} className="text-gray-500" />}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                </div>
              </div>

              <div className="glass-card">
                <div className="glass-card-header">
                  <p className="glass-card-title">Mata Uang & Regional</p>
                </div>
                <div style={{ padding: 20 }}>
                  <Select
                    label="Pilih Mata Uang"
                    selectedKeys={[currency]}
                    onSelectionChange={(keys) => setCurrency(Array.from(keys)[0] as string)}
                    startContent={<DollarSign size={16} className="text-gray-500" />}
                    variant="bordered"
                    classNames={{ trigger: "login-input-wrapper" }}
                  >
                    {ALL_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} textValue={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="glass-card">
                <div className="glass-card-header">
                  <p className="glass-card-title">Daftar Toko Anda</p>
                </div>
                <div style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {shops.map(s => (
                      <div 
                        key={s.id} 
                        style={{ 
                          padding: "12px 16px", 
                          borderRadius: 12, 
                          background: s.id === activeShop.id ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.02)",
                          border: s.id === activeShop.id ? "1px solid rgba(139,92,246,0.3)" : "1px solid rgba(255,255,255,0.05)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>{s.shop_name}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.currency} · {s.whatsapp_number || "No WA belum diatur"}</p>
                        </div>
                        {s.id === activeShop.id && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent-light)", background: "rgba(139,92,246,0.1)", padding: "2px 8px", borderRadius: 4 }}>AKTIF</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "auto" }}>
                <Button
                  isLoading={isSaving}
                  onPress={handleSave}
                  startContent={<Save size={18} />}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                    color: "white",
                    fontWeight: 600,
                    height: 48,
                    borderRadius: 12
                  }}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
