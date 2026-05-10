"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, ShoppingCart, Settings, LogOut,
  Store, Package, ChevronDown, PlusCircle, Building2, Phone, Globe, CheckCircle2, MessageSquare,
} from "lucide-react";
import {
  Tooltip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure,
} from "@heroui/react";
import { useSettings } from "@/context/SettingsContext";
import { createShop } from "@/lib/supabase/shop_settings";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";

const navItems = [
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/inventory", label: "Inventori",  icon: Package },
  { href: "/customers", label: "Pelanggan",  icon: Users },
  { href: "/laporan",   label: "Laporan",    icon: MessageSquare },
  { href: "/orders",    label: "Pesanan",    icon: ShoppingCart },
  { href: "/settings",  label: "Pengaturan", icon: Settings },
];

/** Dynamic currency list – uses browser Intl API, no hardcoding */
function useAllCurrencies() {
  return useMemo(() => {
    try {
      const codes = (Intl as any).supportedValuesOf("currency") as string[];
      const names = new Intl.DisplayNames(["id"], { type: "currency" });
      return codes.map((code: string) => ({ code, name: names.of(code) || code }));
    } catch {
      return [
        { code: "IDR", name: "Rupiah Indonesia" },
        { code: "USD", name: "Dolar AS" },
        { code: "EUR", name: "Euro" },
        { code: "GBP", name: "Pound Britania" },
        { code: "SGD", name: "Dolar Singapura" },
        { code: "MYR", name: "Ringgit Malaysia" },
        { code: "JPY", name: "Yen Jepang" },
        { code: "CNY", name: "Yuan Tiongkok" },
        { code: "KRW", name: "Won Korea" },
        { code: "AUD", name: "Dolar Australia" },
      ];
    }
  }, []);
}

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { shops, activeShop, setActiveShopId, refreshShops } = useSettings();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currencies  = useAllCurrencies();

  // Add-store modal
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [newName,     setNewName]     = useState("");
  const [newWA,       setNewWA]       = useState("");
  const [newCurrency, setNewCurrency] = useState("IDR");
  const [isSaving,    setIsSaving]    = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const resetModal = () => { setNewName(""); setNewWA(""); setNewCurrency("IDR"); };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Nama toko wajib diisi"); return; }
    setIsSaving(true);
    try {
      const shop = await createShop({ shop_name: newName.trim(), whatsapp_number: newWA, currency: newCurrency });
      await refreshShops();
      setActiveShopId(shop.id);
      resetModal();
      onClose();
      toast.success(`Toko "${newName.trim()}" berhasil dibuat!`);
    } catch (err: any) {
      toast.error("Gagal membuat toko: " + err.message);
    } finally { setIsSaving(false); }
  };

  return (
    <>
      <aside className="sidebar">
        {/* Shop Switcher */}
        <div className="sidebar-switcher" ref={dropdownRef}>
          <button className="sidebar-switcher-trigger" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="sidebar-logo">
              <Store size={16} style={{ color: "#a78bfa" }} />
            </div>
            <div className="sidebar-switcher-info">
              <p className="sidebar-brand-name">{activeShop?.shop_name || "Pilih Toko"}</p>
              <p className="sidebar-brand-sub">Management Panel</p>
            </div>
            <ChevronDown size={14} style={{ color: "#64748b", transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }} />
          </button>

          {dropdownOpen && (
            <div className="sidebar-dropdown">
              <p className="sidebar-dropdown-label">Toko Anda</p>
              {shops.map((shop) => (
                <button
                  key={shop.id}
                  className={`sidebar-dropdown-item ${shop.id === activeShop?.id ? "active" : ""}`}
                  onClick={() => { setActiveShopId(shop.id); setDropdownOpen(false); }}
                >
                  <div className={`sidebar-dropdown-icon ${shop.id === activeShop?.id ? "active" : ""}`}>
                    <Store size={14} />
                  </div>
                  <div className="sidebar-dropdown-text">
                    <p className="sidebar-dropdown-name">{shop.shop_name}</p>
                    <div className="sidebar-dropdown-meta">
                      <span className="sidebar-meta-currency">{shop.currency}</span>
                      <span className="sidebar-meta-dot">·</span>
                      <span className="sidebar-meta-id">#{shop.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                  </div>
                  {shop.id === activeShop?.id && (
                    <span className="sidebar-dropdown-badge">Aktif</span>
                  )}
                </button>
              ))}
              {shops.length === 0 && <p className="sidebar-dropdown-empty">Belum ada toko</p>}
              <div className="sidebar-dropdown-divider" />
              <button
                className="sidebar-dropdown-add"
                onClick={() => { setDropdownOpen(false); onOpen(); }}
              >
                <div className="sidebar-dropdown-add-icon"><PlusCircle size={14} /></div>
                <span className="sidebar-dropdown-add-text">Tambah Toko Baru</span>
              </button>
            </div>
          )}
        </div>

        <div className="sidebar-divider" />

        {/* Navigation */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Menu Utama</p>
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`sidebar-item ${isActive ? "sidebar-item-active" : ""}`}>
                <item.icon size={16} style={{ color: isActive ? "#a78bfa" : "var(--text-muted)", flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          <div className="sidebar-user">
            <div className="sidebar-avatar">A</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">Admin</p>
              <p className="sidebar-user-role">Super Admin</p>
            </div>
            <Tooltip content="Keluar" placement="right">
              <button onClick={handleLogout} className="sidebar-logout-btn">
                <LogOut size={14} />
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* ── Add Store Modal ── */}
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) resetModal(); onOpenChange(); }}
        placement="center"
        size="md"
        classNames={{
          base: "bg-[#0f0f18] border border-white/[0.08] shadow-2xl",
          header: "border-b border-white/[0.06] pb-4",
          footer: "border-t border-white/[0.06] pt-4 px-6",
          closeButton: "hover:bg-white/5 top-4 right-4",
        }}
      >
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader>
                <div className="modal-header-inner">
                  <div className="modal-icon purple"><Building2 size={18} /></div>
                  <div>
                    <h2 className="modal-title">Buat Toko Baru</h2>
                    <p className="modal-subtitle">Isi detail di bawah untuk memulai</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="modal-form-body">

                  {/* Section 1: Identity */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon purple"><Store size={11} /></div>
                      <p className="modal-section-label">Identitas Toko</p>
                    </div>
                    <div className="form-field">
                      <label className="form-label">
                        Nama Toko <span className="form-required">*</span>
                      </label>
                      <input
                        className="form-input"
                        placeholder="cth. My Digital Store"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        autoFocus
                      />
                      {newName.trim() && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: -2 }}>
                          <CheckCircle2 size={11} style={{ color: "#34d399", flexShrink: 0 }} />
                          <p className="form-hint" style={{ color: "#34d399", margin: 0 }}>Toko "{newName.trim()}" siap dibuat</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Contact */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon green"><Phone size={11} /></div>
                      <p className="modal-section-label">Kontak Admin <span className="form-optional">Opsional</span></p>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Nomor WhatsApp</label>
                      <input
                        className="form-input"
                        placeholder="cth. 628123456789"
                        value={newWA}
                        onChange={e => setNewWA(e.target.value)}
                      />
                      <p className="form-hint">Format: kode negara + nomor (tanpa tanda +)</p>
                    </div>
                  </div>

                  {/* Section 3: Currency */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon amber"><Globe size={11} /></div>
                      <p className="modal-section-label">Mata Uang & Regional</p>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Mata Uang Default</label>
                      <select
                        className="form-input form-select"
                        value={newCurrency}
                        onChange={e => setNewCurrency(e.target.value)}
                      >
                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                      </select>
                      <p className="form-hint">Digunakan untuk menampilkan harga di seluruh dashboard</p>
                    </div>
                  </div>

                </div>
              </ModalBody>
              <ModalFooter>
                <button className="btn-ghost" style={{ borderRadius: 10 }} onClick={close}>Batal</button>
                <button
                  className="btn-primary"
                  onClick={handleCreate}
                  disabled={isSaving || !newName.trim()}
                  style={{ opacity: (!newName.trim() || isSaving) ? 0.6 : 1, cursor: (!newName.trim() || isSaving) ? "not-allowed" : "pointer" }}
                >
                  {isSaving ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                      Membuat...
                    </span>
                  ) : "Buat Toko & Mulai"}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
