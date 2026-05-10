"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
} from "@heroui/react";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Upload, 
  FileText,
  Package,
  Calendar,
  KeyRound,
  DollarSign,
  ShieldCheck,
  Hash,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addInventoryItems,
  type InventoryItem,
} from "@/lib/supabase/inventory";
import { useSettings } from "@/context/SettingsContext";
import { formatCurrency } from "@/lib/utils";

const STATUSES = ["Tersedia", "Terjual", "Nonaktif"] as const;

// Preset slot types — user can also type a custom value
const SLOT_PRESETS = ["1 User", "2 User", "Semi Priv", "Full Priv", "Sharing"];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={onCopy} className="copy-btn">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
};

export default function InventoryPage() {
  const { activeShop } = useSettings();
  const currency = activeShop?.currency || "IDR";
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("semua");
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [customSlot, setCustomSlot] = useState("");
  const [form, setForm] = useState({
    app_name: "",
    profile_name: "",
    login_email: "",
    login_password: "",
    pin: "",
    slot_type: "",
    quantity: 1,
    capital_cost: "" as any,
    restock_date: "",
    supplier_billing_date: "",
    status: "Tersedia" as InventoryItem["status"],
  });

  useEffect(() => {
    if (!activeShop?.id) return;
    const unsub = subscribeToInventory(activeShop.id, setItems);
    return unsub;
  }, [activeShop?.id]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        item.app_name.toLowerCase().includes(search.toLowerCase()) ||
        item.login_email.toLowerCase().includes(search.toLowerCase()) ||
        (item.profile_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (item.slot_type?.toLowerCase() || "").includes(search.toLowerCase());
      const matchStatus = statusFilter === "semua" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  const pages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const resetForm = () => {
    setForm({ app_name: "", profile_name: "", login_email: "", login_password: "", pin: "", slot_type: "", quantity: 1, capital_cost: "", restock_date: "", supplier_billing_date: "", status: "Tersedia" });
    setEditId(null);
    setCustomSlot("");
    setShowPassword(false);
  };

  const openAdd = () => { resetForm(); onOpen(); };

  const openEdit = (item: InventoryItem) => {
    const slotIsPreset = SLOT_PRESETS.includes(item.slot_type || "");
    setForm({
      app_name: item.app_name,
      profile_name: item.profile_name || "",
      login_email: item.login_email,
      login_password: item.login_password,
      pin: item.pin || "",
      slot_type: slotIsPreset ? (item.slot_type || "") : "custom",
      quantity: item.quantity ?? 1,
      capital_cost: item.capital_cost ?? "",
      restock_date: item.restock_date || "",
      supplier_billing_date: item.supplier_billing_date || "",
      status: item.status,
    });
    if (!slotIsPreset && item.slot_type) setCustomSlot(item.slot_type);
    setEditId(item.id);
    onOpen();
  };

  const resolvedSlotType = () => {
    if (form.slot_type === "custom") return customSlot.trim() || null;
    return form.slot_type || null;
  };

  const handleSave = async () => {
    if (!activeShop?.id) return;
    if (!form.app_name || !form.login_email || !form.login_password) {
      toast.error("Mohon lengkapi data wajib (Aplikasi, Email, Password)");
      return;
    }
    if (form.pin && !/^\d{4}$/.test(form.pin)) {
      toast.error("PIN harus tepat 4 digit angka");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        app_name: form.app_name,
        profile_name: form.profile_name || null,
        login_email: form.login_email,
        login_password: form.login_password,
        pin: form.pin || null,
        slot_type: resolvedSlotType(),
        quantity: Number(form.quantity) || 1,
        capital_cost: form.capital_cost ? Number(form.capital_cost) : null,
        restock_date: form.restock_date || null,
        supplier_billing_date: form.supplier_billing_date || null,
        status: form.status,
        profile_id: activeShop.id,
      };
      if (editId) {
        await updateInventoryItem(editId, payload);
        toast.success("Item berhasil diperbarui");
      } else {
        await addInventoryItem(payload as any);
        toast.success("Item berhasil ditambahkan");
      }
      onOpenChange();
      resetForm();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + (err.message ?? "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus item "${name}"?`)) return;
    try {
      await deleteInventoryItem(id);
      toast.success("Item berhasil dihapus");
    } catch { toast.error("Gagal menghapus"); }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { toast.error("Library Excel belum siap."); return; }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsLoading(true);
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        if (!data.length) { toast.error("File kosong"); return; }
        const mapped = data.map((r: any) => ({
          profile_id: activeShop?.id || "",
          app_name: r.Aplikasi || r.app_name || "Tanpa Nama",
          profile_name: r.Profile || r.profile_name || null,
          login_email: r.Email || r.login_email || "",
          login_password: r.Password || r.login_password || "",
          pin: r.PIN || r.pin || null,
          slot_type: r.Jenis || r.slot_type || null,
          quantity: r.Qty ? Number(r.Qty) : 1,
          capital_cost: r.Modal ? Number(r.Modal) : null,
          restock_date: r.TglRestock || null,
          supplier_billing_date: r.TglBilling || null,
          status: (r.Status || "Tersedia") as InventoryItem["status"],
        }));
        await addInventoryItems(mapped);
        toast.success(`${mapped.length} item diimpor`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: any) {
        toast.error("Gagal: " + err.message);
      } finally { setIsLoading(false); }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { toast.error("Library Excel belum siap."); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(items.map(i => ({
      Aplikasi: i.app_name, Profile: i.profile_name, Email: i.login_email,
      Password: i.login_password, PIN: i.pin, Jenis: i.slot_type, Qty: i.quantity,
      Modal: i.capital_cost, Status: i.status, TglRestock: i.restock_date, TglBilling: i.supplier_billing_date,
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Inventory_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { toast.error("Library Excel belum siap."); return; }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([["Aplikasi", "Profile", "Email", "Password", "PIN", "Jenis", "Qty", "Modal", "Status", "TglRestock", "TglBilling"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Inventory.xlsx");
    toast.success("Template diunduh");
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Inventori Stok</h1>
        <p className="page-subtitle">Kelola stok akun dan inventaris toko Anda</p>
      </div>

      <div className="page-content">
        <div className="glass-card">
          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Cari aplikasi, profil, jenis..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="filter-tabs">
                {(["semua", ...STATUSES]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    className={`filter-tab ${statusFilter === s ? "active" : ""}`}
                  >
                    {s === "semua" ? "Semua" : s}
                  </button>
                ))}
              </div>
            </div>
            <div className="table-toolbar-right">
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx,.xls" style={{ display: "none" }} />
              <div className="btn-group">
                <button className="btn-ghost" onClick={handleDownloadTemplate}><FileText size={14} /> Template</button>
                <button className="btn-ghost" onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Impor</button>
                <button className="btn-ghost" onClick={handleExport}><Download size={14} /> Ekspor</button>
              </div>
              <button className="btn-primary" onClick={openAdd}>
                <Plus size={16} /> Tambah Stok
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aplikasi / Profil</th>
                  <th>Info Login</th>
                  <th>Jenis / PIN</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Modal</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <p className="empty-state-text">Inventory kosong</p>
                      </div>
                    </td>
                  </tr>
                ) : paged.map((item) => (
                  <tr key={item.id} className="data-row">
                    <td>
                      <p className="cell-primary">{item.app_name}</p>
                      <p className="cell-secondary">{item.profile_name || "Tanpa Profil"}</p>
                    </td>
                    <td>
                      <div className="cell-copy-row">
                        <span className="cell-mono">{item.login_email}</span>
                        <CopyButton text={item.login_email} />
                      </div>
                      <div className="cell-copy-row">
                        <span className="cell-mono cell-secondary">••••••••</span>
                        <CopyButton text={item.login_password} />
                      </div>
                    </td>
                    <td>
                      {item.slot_type && (
                        <span className="inv-badge slot">{item.slot_type}</span>
                      )}
                      {item.pin && (
                        <div className="cell-copy-row" style={{ marginTop: item.slot_type ? 4 : 0 }}>
                          <span className="cell-mono" style={{ fontSize: 11, letterSpacing: "0.15em" }}>PIN: {item.pin}</span>
                          <CopyButton text={item.pin} />
                        </div>
                      )}
                      {!item.slot_type && !item.pin && <span className="cell-secondary">—</span>}
                    </td>
                    <td>
                      <span className="inv-qty-badge">{item.quantity ?? 1}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status === "Tersedia" ? "green" : item.status === "Terjual" ? "amber" : "red"}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="cell-date-row"><Calendar size={11} className="cell-icon" /> <span className="cell-secondary">Restock:</span> <span className="cell-date">{item.restock_date || "—"}</span></div>
                      <div className="cell-date-row"><Calendar size={11} className="cell-icon" /> <span className="cell-secondary">Billing:</span> <span className="cell-date">{item.supplier_billing_date || "—"}</span></div>
                    </td>
                    <td>
                      <p className="cell-primary">{item.capital_cost ? formatCurrency(item.capital_cost, currency) : "—"}</p>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <Tooltip content="Edit" color="secondary" size="sm">
                          <button className="action-btn" onClick={() => openEdit(item)}><Pencil size={14} /></button>
                        </Tooltip>
                        <Tooltip content="Hapus" color="danger" size="sm">
                          <button className="action-btn danger" onClick={() => handleDelete(item.id, item.app_name)}><Trash2 size={14} /></button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length > rowsPerPage && (
            <div className="table-footer">
              <span className="table-count">{filtered.length} item ditemukan</span>
              <Pagination isCompact showControls color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(); }}
        placement="center"
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "bg-[#0f0f18] border border-white/[0.08] shadow-2xl",
          closeButton: "hover:bg-white/5 top-4 right-4",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <div className="modal-header-inner">
                  <div className="modal-icon purple">
                    <Package size={18} />
                  </div>
                  <div>
                    <h2 className="modal-title">{editId ? "Edit Item Inventori" : "Tambah Stok Baru"}</h2>
                    <p className="modal-subtitle">Lengkapi detail akun untuk inventori Anda</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="modal-form-body">

                  {/* Section 1: Account Info */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon purple"><Package size={11} /></div>
                      <p className="modal-section-label">Informasi Akun</p>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Nama Aplikasi <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="cth. Netflix" value={form.app_name} onChange={e => setForm(f => ({ ...f, app_name: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Profil / Label <span className="form-optional">Opsional</span></label>
                        <input className="form-input" placeholder="cth. Erna" value={form.profile_name} onChange={e => setForm(f => ({ ...f, profile_name: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Email Login <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="email@example.com" value={form.login_email} onChange={e => setForm(f => ({ ...f, login_email: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Password Login <span className="form-required">*</span></label>
                        <div className="input-with-action">
                          <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Password akun" value={form.login_password} onChange={e => setForm(f => ({ ...f, login_password: e.target.value }))} />
                          <button type="button" className="input-action-btn" onClick={() => setShowPassword(v => !v)}>
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Slot & PIN */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon amber"><KeyRound size={11} /></div>
                      <p className="modal-section-label">Jenis & Akses <span className="form-optional" style={{ marginLeft: 6 }}>Opsional</span></p>
                    </div>
                    
                    {/* Slot type pills */}
                    <div className="form-field">
                      <label className="form-label"><Users size={12} style={{ display: "inline", marginRight: 4 }} />Jenis Slot</label>
                      <div className="slot-pills">
                        {SLOT_PRESETS.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={`slot-pill ${form.slot_type === s ? "active" : ""}`}
                            onClick={() => setForm(f => ({ ...f, slot_type: f.slot_type === s ? "" : s }))}
                          >
                            {s}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`slot-pill ${form.slot_type === "custom" ? "active" : ""}`}
                          onClick={() => setForm(f => ({ ...f, slot_type: f.slot_type === "custom" ? "" : "custom" }))}
                        >
                          + Lainnya
                        </button>
                      </div>
                      {form.slot_type === "custom" && (
                        <input
                          className="form-input"
                          style={{ marginTop: 10 }}
                          placeholder="Masukkan jenis custom..."
                          value={customSlot}
                          onChange={e => setCustomSlot(e.target.value)}
                        />
                      )}
                    </div>

                    {/* PIN + Quantity in a row */}
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label"><Hash size={12} style={{ display: "inline", marginRight: 4 }} />PIN <span className="form-optional">4 digit</span></label>
                        <input
                          className="form-input"
                          placeholder="0000"
                          maxLength={4}
                          inputMode="numeric"
                          pattern="\d{4}"
                          value={form.pin}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setForm(f => ({ ...f, pin: v }));
                          }}
                        />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Jumlah Stok <span className="form-required">*</span></label>
                        <input
                          className="form-input"
                          type="number"
                          min="1"
                          placeholder="1"
                          value={form.quantity}
                          onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Schedule & Cost */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon blue"><Calendar size={11} /></div>
                      <p className="modal-section-label">Jadwal & Biaya <span className="form-optional" style={{ marginLeft: 6 }}>Opsional</span></p>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Tanggal Restock</label>
                        <input className="form-input" type="date" value={form.restock_date} onChange={e => setForm(f => ({ ...f, restock_date: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Tgl Tagihan Supplier</label>
                        <input className="form-input" type="date" value={form.supplier_billing_date} onChange={e => setForm(f => ({ ...f, supplier_billing_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="form-label"><DollarSign size={12} style={{ display: "inline", marginRight: 4 }} />Modal ({currency})</label>
                      <input className="form-input" type="number" placeholder="0" min="0" value={form.capital_cost} onChange={e => setForm(f => ({ ...f, capital_cost: e.target.value }))} />
                    </div>
                  </div>

                  {/* Section 4: Status */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon green"><ShieldCheck size={11} /></div>
                      <p className="modal-section-label">Status Stok</p>
                    </div>
                    <div className="slot-pills">
                      {STATUSES.map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`slot-pill ${form.status === s ? `active status-${s.toLowerCase()}` : ""}`}
                          onClick={() => setForm(f => ({ ...f, status: s }))}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </ModalBody>
              <ModalFooter>
                <button className="modal-btn-secondary" onClick={() => { resetForm(); onClose(); }}>Batal</button>
                <button
                  disabled={isLoading}
                  onClick={handleSave}
                  className="modal-btn-primary"
                >
                  {isLoading ? "Menyimpan..." : (editId ? "Simpan Perubahan" : "Tambah Stok")}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
