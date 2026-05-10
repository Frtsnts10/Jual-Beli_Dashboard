"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Tooltip,
} from "@heroui/react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  FileText,
  MessageCircle,
  User,
  Calendar,
  ShoppingBag,
  DollarSign,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  type Subscription,
} from "@/lib/supabase/subscriptions";
import { subscribeToInventory, type InventoryItem } from "@/lib/supabase/inventory";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency } from "@/lib/utils";

const EMPTY_FORM = {
  inventory_id: "",
  customer_name: "",
  customer_email: "",
  whatsapp_number: "",
  subscription_plan: "",
  start_date: "",
  duration: "",
  expiry_date: "",
  selling_price: "" as any,
};

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="form-field">
    <label className="form-label">{label}</label>
    {children}
  </div>
);

export default function CustomersPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeShop } = useSettings();
  const currency = activeShop?.currency || "IDR";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowsPerPage = 10;

  useEffect(() => {
    if (!activeShop?.id) { setSubs([]); setInventory([]); setIsLoading(false); return; }
    const unsubSubs = subscribeToSubscriptions(activeShop.id, (data) => { setSubs(data); setIsLoading(false); });
    const unsubInv = subscribeToInventory(activeShop.id, setInventory);
    return () => { unsubSubs(); unsubInv(); };
  }, [activeShop?.id]);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      const matchSearch =
        s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.customer_email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        s.whatsapp_number.includes(search) ||
        (s.inventory?.app_name ?? "").toLowerCase().includes(search.toLowerCase());
      const isExp = s.expiry_date ? new Date(s.expiry_date) < new Date() : false;
      if (statusFilter === "aktif") return matchSearch && !isExp;
      if (statusFilter === "kadaluarsa") return matchSearch && isExp;
      return matchSearch;
    });
  }, [subs, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [page, filtered]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); };
  const openAdd = () => { resetForm(); onOpen(); };

  const openEdit = (sub: Subscription) => {
    setEditId(sub.id);
    setForm({
      inventory_id: sub.inventory_id ?? "",
      customer_name: sub.customer_name,
      customer_email: sub.customer_email ?? "",
      whatsapp_number: sub.whatsapp_number,
      subscription_plan: sub.subscription_plan ?? "",
      start_date: sub.start_date ?? "",
      duration: sub.duration?.toString() ?? "",
      expiry_date: sub.expiry_date ?? "",
      selling_price: sub.selling_price?.toString() ?? "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.customer_name.trim() || !form.whatsapp_number.trim()) {
      toast.error("Nama dan Nomor WA wajib diisi");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        inventory_id: form.inventory_id || null,
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        whatsapp_number: form.whatsapp_number,
        subscription_plan: form.subscription_plan || null,
        start_date: form.start_date || null,
        duration: form.duration ? parseInt(form.duration) : null,
        expiry_date: form.expiry_date || null,
        selling_price: form.selling_price ? parseFloat(form.selling_price) : 0,
        profile_id: activeShop?.id || "",
      };
      if (editId) {
        await updateSubscription(editId, payload);
        toast.success("Data pelanggan berhasil diperbarui");
      } else {
        await addSubscription(payload);
        toast.success("Pelanggan berhasil ditambahkan");
      }
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + (err.message ?? "Unknown"));
    } finally { setIsLoading(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data pelanggan "${name}"?`)) return;
    try { await deleteSubscription(id); toast.success("Pelanggan dihapus"); }
    catch { toast.error("Gagal menghapus"); }
  };

  const openWA = (num: string) => {
    const clean = num.replace(/\D/g, "");
    const formatted = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
    window.open(`https://wa.me/${formatted}`, "_blank");
  };

  const handleDownloadTemplate = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { toast.error("Library Excel belum siap."); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["NamaPelanggan", "Email", "NomorWA", "Paket", "TglMulai", "Durasi", "TglHabis"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Pelanggan.xlsx");
    toast.success("Template diunduh");
  };

  const handleExport = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { toast.error("Library Excel belum siap."); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(subs.map(s => ({ NamaPelanggan: s.customer_name, Email: s.customer_email || "", NomorWA: s.whatsapp_number, Aplikasi: s.inventory?.app_name || "", Paket: s.subscription_plan || "", TglMulai: s.start_date || "", Durasi: s.duration || "", TglHabis: s.expiry_date || "" })));
    XLSX.utils.book_append_sheet(wb, ws, "Pelanggan");
    XLSX.writeFile(wb, `Pelanggan_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Data Pelanggan</h1>
        <p className="page-subtitle">Kelola daftar pelanggan dan langganan aktif Anda</p>
      </div>

      <div className="page-content">
        <div className="glass-card">
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Cari nama, email, nomor WA..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="filter-tabs">
                {["semua", "aktif", "kadaluarsa"].map((s) => (
                  <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`filter-tab ${statusFilter === s ? "active" : ""}`}>
                    {s === "semua" ? "Semua" : s === "aktif" ? "Aktif" : "Kadaluarsa"}
                  </button>
                ))}
              </div>
            </div>
            <div className="table-toolbar-right">
              <input type="file" ref={fileInputRef} style={{ display: "none" }} accept=".xlsx,.xls" />
              <div className="btn-group">
                <button className="btn-ghost" onClick={handleDownloadTemplate}><FileText size={14} /> Template</button>
                <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Impor</button>
                <button className="btn-ghost" onClick={handleExport}><Download size={14} /> Ekspor</button>
              </div>
              <button className="btn-primary" onClick={openAdd}>
                <Plus size={16} /> Tambah Pelanggan
              </button>
            </div>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Kontak</th>
                  <th>Langganan</th>
                  <th>Paket</th>
                  <th>Status Exp</th>
                  <th>Harga Jual</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-state-icon">👥</div>
                        <p className="empty-state-text">Belum ada data pelanggan</p>
                      </div>
                    </td>
                  </tr>
                ) : paged.map((sub) => {
                  const isExp = sub.expiry_date ? new Date(sub.expiry_date) < new Date() : false;
                  return (
                    <tr key={sub.id} className="data-row">
                      <td>
                        <p className="cell-primary">{sub.customer_name}</p>
                        <p className="cell-secondary">{sub.customer_email || "Tanpa Email"}</p>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{sub.whatsapp_number}</span>
                          <Tooltip content="Chat WA" color="success" size="sm">
                            <button className="action-btn" onClick={() => openWA(sub.whatsapp_number)} style={{ color: "#22c55e" }}>
                              <MessageCircle size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                      <td>
                        <p className="cell-primary" style={{ fontSize: 13 }}>{sub.inventory?.app_name || "Langganan Mandiri"}</p>
                        {sub.inventory?.login_email && (
                          <p className="cell-secondary" style={{ fontFamily: "monospace", fontSize: 10 }}>{sub.inventory.login_email}</p>
                        )}
                      </td>
                      <td>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{sub.subscription_plan || "—"}</p>
                        <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub.duration ? `${sub.duration} Hari` : ""}</p>
                      </td>
                      <td>
                        <span className={`status-badge ${isExp ? "red" : "green"}`}>
                          {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString("id-ID") : "—"}
                        </span>
                      </td>
                      <td>
                        <p className="cell-primary">{sub.selling_price ? formatCurrency(sub.selling_price, currency) : "—"}</p>
                      </td>
                      <td>
                        <div className="cell-actions">
                          <Tooltip content="Edit" color="secondary" size="sm">
                            <button className="action-btn" onClick={() => openEdit(sub)}><Pencil size={14} /></button>
                          </Tooltip>
                          <Tooltip content="Hapus" color="danger" size="sm">
                            <button className="action-btn danger" onClick={() => handleDelete(sub.id, sub.customer_name)}><Trash2 size={14} /></button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > rowsPerPage && (
            <div className="table-footer">
              <span className="table-count">{filtered.length} pelanggan ditemukan</span>
              <Pagination isCompact showControls color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(); }}
        placement="center"
        size="2xl"
        classNames={{
          base: "bg-[#0f0f18] border border-white/[0.08] shadow-2xl",
          closeButton: "hover:bg-white/5 top-4 right-4",
          header: "!p-6 !border-b !border-white/[0.06]",
          footer: "!p-6 !border-t !border-white/[0.06]",
          backdrop: "bg-[#08080f]/60 backdrop-blur-xl",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="!p-6 !border-b !border-white/[0.06]">
                <div className="modal-header-inner">
                  <div className="modal-icon blue">
                    <User size={18} />
                  </div>
                  <div>
                    <h2 className="modal-title">{editId ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}</h2>
                    <p className="modal-subtitle">Informasi personal dan paket langganan</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="modal-form-body">

                  {/* Section 1: Customer Identity */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon blue"><User size={11} /></div>
                      <p className="modal-section-label">Identitas Pelanggan</p>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Nama Pelanggan <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="cth. Budi Santoso" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Nomor WhatsApp <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="cth. 0812xxxx" value={form.whatsapp_number} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Email Pelanggan <span className="form-optional">Opsional</span></label>
                      <input className="form-input" placeholder="budi@example.com" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
                    </div>
                  </div>

                  {/* Section 2: Subscription */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon purple"><ShoppingBag size={11} /></div>
                      <p className="modal-section-label">Detail Langganan</p>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Produk Inventori <span className="form-optional">Opsional</span></label>
                      <select className="form-input form-select" value={form.inventory_id} onChange={e => setForm(f => ({ ...f, inventory_id: e.target.value }))}>
                        <option value="">— Pilih stok yang tersedia —</option>
                        {inventory.map(item => (
                          <option key={item.id} value={item.id}>{item.app_name} ({item.profile_name || item.login_email})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Paket Langganan <span className="form-optional">Opsional</span></label>
                        <input className="form-input" placeholder="cth. 1 User, 2 User" value={form.subscription_plan} onChange={e => setForm(f => ({ ...f, subscription_plan: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Durasi <span className="form-optional">Hari</span></label>
                        <input className="form-input" type="number" placeholder="30" min="1" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Schedule & Price */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon green"><DollarSign size={11} /></div>
                      <p className="modal-section-label">Jadwal & Harga</p>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Tanggal Mulai</label>
                        <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Tanggal Berakhir</label>
                        <input className="form-input" type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Harga Jual ({currency})</label>
                      <input className="form-input" type="number" placeholder="0" min="0" value={form.selling_price} onChange={e => setForm(f => ({ ...f, selling_price: e.target.value }))} />
                    </div>
                  </div>

                </div>
              </ModalBody>
              <ModalFooter className="!p-6 !border-t !border-white/[0.06]">
                <button className="modal-btn-secondary" onClick={() => { resetForm(); onClose(); }}>Batal</button>
                <button
                  disabled={isLoading}
                  onClick={handleSave}
                  className="modal-btn-primary"
                >
                  {isLoading ? "Menyimpan..." : (editId ? "Simpan Perubahan" : "Tambah Pelanggan")}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
