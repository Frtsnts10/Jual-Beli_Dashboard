"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Input,
  Button,
  Select,
  SelectItem,
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

import { useSettings } from "@/context/SettingsContext";
import { formatCurrency } from "@/lib/utils";

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
    if (!activeShop?.id) {
      setSubs([]);
      setInventory([]);
      setIsLoading(false);
      return;
    }

    const unsubSubs = subscribeToSubscriptions(activeShop.id, (data) => {
      setSubs(data);
      setIsLoading(false);
    });
    
    const unsubInv = subscribeToInventory(activeShop.id, setInventory);

    return () => {
      unsubSubs();
      unsubInv();
    };
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
  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, filtered]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
  };

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
      toast.error("Gagal menyimpan: " + (err.message ?? "Kesalahan tidak diketahui"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data pelanggan "${name}"?`)) return;
    try {
      await deleteSubscription(id);
      toast.success("Data pelanggan berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus data");
    }
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
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        if (data.length === 0) {
          toast.error("File kosong atau format tidak sesuai");
          return;
        }

        for (const row of data) {
          await addSubscription({
            id: crypto.randomUUID(),
            inventory_id: row.inventory_id || null,
            customer_name: row.NamaPelanggan || row.customer_name || "Tanpa Nama",
            customer_email: row.Email || row.customer_email || null,
            whatsapp_number: row.NomorWA || row.whatsapp_number || "",
            subscription_plan: row.Paket || row.subscription_plan || null,
            start_date: row.TglMulai || row.start_date || null,
            duration: row.Durasi ? parseInt(row.Durasi) : null,
            expiry_date: row.TglHabis || row.expiry_date || null,
          });
        }
        toast.success(`${data.length} pelanggan berhasil diimpor`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: any) {
        toast.error("Gagal mengimpor: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { toast.error("Library Excel belum siap."); return; }

    const exportData = subs.map((s) => ({
      NamaPelanggan: s.customer_name,
      Email: s.customer_email || "",
      NomorWA: s.whatsapp_number,
      Aplikasi: s.inventory?.app_name || "",
      Paket: s.subscription_plan || "",
      TglMulai: s.start_date || "",
      Durasi: s.duration || "",
      TglHabis: s.expiry_date || "",
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Pelanggan");
    XLSX.writeFile(wb, `Pelanggan_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) { toast.error("Library Excel belum siap."); return; }
    const headers = [["NamaPelanggan", "Email", "NomorWA", "Paket", "TglMulai", "Durasi", "TglHabis"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template Pelanggan");
    XLSX.writeFile(wb, "Template_Pelanggan.xlsx");
    toast.success("Template berhasil diunduh");
  };

  const openWA = (num: string) => {
    const clean = num.replace(/\D/g, "");
    const formatted = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
    window.open(`https://wa.me/${formatted}`, "_blank");
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Data Pelanggan</h1>
        <p className="page-subtitle">Kelola daftar pelanggan dan langganan aktif Anda</p>
      </div>

      <div className="page-content">
        <div className="glass-card">
          <div className="glass-card-header" style={{ flexDirection: "column", gap: 16, alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <Input
                  placeholder="Cari nama, email, nomor WA..."
                  value={search}
                  onValueChange={(v) => { setSearch(v); setPage(1); }}
                  startContent={<Search size={16} className="text-gray-400" />}
                  size="sm"
                  variant="bordered"
                  classNames={{ 
                    inputWrapper: "login-input-wrapper table-search-wrapper", 
                    base: "w-[380px]" 
                  }}
                />
                <div className="table-actions">
                  {(["semua", "aktif", "kadaluarsa"]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`table-action-btn ${statusFilter === s ? "active" : ""}`}
                    >
                      {s === "semua" ? "Semua" : s === "aktif" ? "Aktif" : "Kadaluarsa"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                />
                <div className="secondary-actions">
                  <Button 
                    size="sm" 
                    variant="light"
                    className="secondary-action-btn"
                    startContent={<FileText size={14} />}
                    onPress={handleDownloadTemplate}
                  >
                    Template
                  </Button>
                  <Button 
                    size="sm" 
                    variant="light"
                    className="secondary-action-btn"
                    startContent={<Upload size={14} />}
                    onPress={() => fileInputRef.current?.click()}
                  >
                    Impor
                  </Button>
                  <Button 
                    size="sm" 
                    variant="light"
                    className="secondary-action-btn"
                    startContent={<Download size={14} />}
                    onPress={handleExport}
                  >
                    Ekspor
                  </Button>
                </div>
                <button
                  onClick={openAdd}
                  className="btn-primary"
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: "0 2px 12px rgba(139,92,246,0.3)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}
                >
                  <Plus size={13} />
                  Tambah Pelanggan
                </button>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Nama Pelanggan", "Kontak", "Langganan", "Paket", "Status Exp", "Harga Jual", "Aksi"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
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
                ) : (
                  paged.map((sub) => {
                    const isExp = sub.expiry_date ? new Date(sub.expiry_date) < new Date() : false;
                    return (
                      <tr
                        key={sub.id}
                        style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "13px 16px" }}>
                          <p style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{sub.customer_name}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub.customer_email || "Tanpa Email"}</p>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{sub.whatsapp_number}</span>
                            <Tooltip content="Chat WhatsApp">
                              <button onClick={() => openWA(sub.whatsapp_number)} style={{ background: "none", border: "none", cursor: "pointer", color: "#25D366", padding: 2 }}>
                                <MessageCircle size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <p style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                            {sub.inventory?.app_name || "Langganan Mandiri"}
                          </p>
                          {sub.inventory?.login_email && (
                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub.inventory.login_email}</p>
                          )}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>{sub.subscription_plan || "-"}</p>
                          <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{sub.duration ? `${sub.duration} Hari` : ""}</p>
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <span className={`badge ${isExp ? "badge-expired" : "badge-sold"}`}>
                            {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString("id-ID") : "-"}
                          </span>
                        </td>
                        <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {sub.selling_price ? formatCurrency(sub.selling_price, currency) : "-"}
                        </td>
                        <td style={{ padding: "13px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <Tooltip content="Edit">
                              <button onClick={() => openEdit(sub)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><Pencil size={15} /></button>
                            </Tooltip>
                            <Tooltip content="Hapus">
                              <button onClick={() => handleDelete(sub.id, sub.customer_name)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><Trash2 size={15} /></button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > rowsPerPage && (
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{filtered.length} pelanggan ditemukan</span>
              <Pagination isCompact showControls color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal backdrop="blur" isOpen={isOpen} placement="center" size="lg" onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(); }} classNames={{ base: "bg-[#111118] border border-white/[0.08]", header: "border-b border-white/[0.06]", footer: "border-t border-white/[0.06]" }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editId ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}</ModalHeader>
              <ModalBody className="py-5 gap-4">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Nama Pelanggan *" placeholder="cth. Budi Santoso" value={form.customer_name} onValueChange={(v) => setForm(f => ({ ...f, customer_name: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                  <Input label="Nomor WA *" placeholder="cth. 0812xxxx" value={form.whatsapp_number} onValueChange={(v) => setForm(f => ({ ...f, whatsapp_number: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                </div>
                <Input label="Email Pelanggan" placeholder="cth. budi@email.com" value={form.customer_email} onValueChange={(v) => setForm(f => ({ ...f, customer_email: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                <Select
                  label="Produk Inventori (Opsional)"
                  selectedKeys={form.inventory_id ? [form.inventory_id] : []}
                  onSelectionChange={(keys) => setForm(f => ({ ...f, inventory_id: Array.from(keys)[0] as string ?? "" }))}
                  variant="bordered"
                  classNames={{ trigger: "login-input-wrapper" }}
                >
                  {inventory.map(item => (
                    <SelectItem key={item.id}>{item.app_name} — {item.profile_name || item.login_email}</SelectItem>
                  ))}
                </Select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Paket Langganan" placeholder="cth. 1 User, 2 User" value={form.subscription_plan} onValueChange={(v) => setForm(f => ({ ...f, subscription_plan: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                  <Input label="Durasi (Hari)" type="number" placeholder="cth. 30" value={form.duration} onValueChange={(v) => setForm(f => ({ ...f, duration: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Tanggal Mulai" type="date" value={form.start_date} onValueChange={(v) => setForm(f => ({ ...f, start_date: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                  <Input label="Harga Jual" type="number" placeholder="0" value={form.selling_price} onValueChange={(v) => setForm(f => ({ ...f, selling_price: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                </div>
                <Input label="Tanggal Habis" type="date" value={form.expiry_date} onValueChange={(v) => setForm(f => ({ ...f, expiry_date: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" color="danger" onPress={() => { resetForm(); onClose(); }}>Batal</Button>
                <Button
                  isLoading={isLoading}
                  onPress={handleSave}
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "white", fontWeight: 600, paddingLeft: 28, paddingRight: 28 }}
                >
                  {editId ? "Simpan Perubahan" : "Tambah Pelanggan"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
