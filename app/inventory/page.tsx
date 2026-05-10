"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import {
  Input,
  Button,
  Select,
  SelectItem,
  Textarea,
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
  Copy,
  Check,
  Download,
  Upload,
  FileText,
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

const EMPTY_FORM = {
  app_name: "",
  profile_name: "",
  login_email: "",
  login_password: "",
  capital_cost: "",
  restock_date: "",
  supplier_billing_date: "",
  status: "Tersedia" as InventoryItem["status"],
};


function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: copied ? "var(--success)" : "var(--text-muted)",
        padding: "2px",
        display: "inline-flex",
        transition: "color 0.15s",
      }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeShop } = useSettings();
  const currency = activeShop?.currency || "IDR";

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowsPerPage = 10;

  useEffect(() => {
    if (!activeShop?.id) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const unsub = subscribeToInventory(activeShop.id, (data) => {
      setItems(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [activeShop?.id]);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      const matchSearch =
        a.app_name.toLowerCase().includes(search.toLowerCase()) ||
        a.login_email.toLowerCase().includes(search.toLowerCase()) ||
        (a.profile_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "semua" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, filtered]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
  };

  const openAdd = () => {
    resetForm();
    onOpen();
  };

  const openEdit = (item: InventoryItem) => {
    setEditId(item.id);
    setForm({
      app_name: item.app_name,
      profile_name: item.profile_name ?? "",
      login_email: item.login_email,
      login_password: item.login_password,
      capital_cost: item.capital_cost?.toString() ?? "",
      restock_date: item.restock_date ?? "",
      supplier_billing_date: item.supplier_billing_date ?? "",
      status: item.status,
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.app_name.trim() || !form.login_email.trim() || !form.login_password.trim()) {
      toast.error("Nama Aplikasi, Email, dan Password wajib diisi");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...form,
        capital_cost: form.capital_cost ? Number(form.capital_cost) : null,
        restock_date: form.restock_date || null,
        supplier_billing_date: form.supplier_billing_date || null,
        profile_id: activeShop?.id || "",
      };
      if (editId) {
        await updateInventoryItem(editId, payload);
        toast.success("Item inventori berhasil diperbarui");
      } else {
        await addInventoryItem({
          ...payload,
          id: crypto.randomUUID(),
        });
        toast.success("Item inventori berhasil ditambahkan");
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
    if (!confirm(`Hapus item "${name}" dari inventori?`)) return;
    try {
      await deleteInventoryItem(id);
      toast.success("Item berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus item");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Library Excel belum siap.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setIsLoading(true);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const mapped: Omit<InventoryItem, "id">[] = data.map((row) => ({
          profile_id: activeShop?.id || "",
          app_name: row.Aplikasi || row.app_name || "Tanpa Nama",
          profile_name: row.Profile || row.profile_name || null,
          login_email: row.Email || row.login_email || "",
          login_password: row.Password || row.login_password || "",
          capital_cost: row.Modal || row.capital_cost ? Number(row.Modal || row.capital_cost) : null,
          restock_date: row.TglRestock || row.restock_date || null,
          supplier_billing_date: row.TglBilling || row.supplier_billing_date || null,
          status: (row.Status || "Tersedia") as InventoryItem["status"],
        }));

        if (mapped.length === 0) {
          toast.error("File kosong atau format tidak sesuai");
          return;
        }
        await addInventoryItems(mapped);
        toast.success(`${mapped.length} item berhasil diimpor`);
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
    if (!XLSX) {
      toast.error("Library Excel belum siap.");
      return;
    }
    const exportData = items.map((item) => ({
      Aplikasi: item.app_name,
      Profile: item.profile_name,
      Email: item.login_email,
      Password: item.login_password,
      Modal: item.capital_cost,
      Status: item.status,
      TglRestock: item.restock_date,
      TglBilling: item.supplier_billing_date,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `Inventory_Shop_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Library Excel belum siap.");
      return;
    }
    const headers = [["Aplikasi", "Profile", "Email", "Password", "Modal", "Status", "TglRestock", "TglBilling"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template Inventory");
    XLSX.writeFile(wb, "Template_Inventory.xlsx");
    toast.success("Template berhasil diunduh");
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Inventori Stok</h1>
        <p className="page-subtitle">Kelola stok akun dan inventaris toko Anda</p>
      </div>

      <div className="page-content">
        <div className="glass-card">
          <div className="glass-card-header" style={{ flexDirection: "column", gap: 16, alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                <Input
                  placeholder="Cari aplikasi, profil, email..."
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
                  {(["semua", ...STATUSES]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`table-action-btn ${statusFilter === s ? "active" : ""}`}
                    >
                      {s === "semua" ? "Semua" : s}
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
                    padding: "8px 24px",
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
                  Tambah Stok
                </button>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Aplikasi / Profil", "Info Login", "Status", "Tanggal", "Modal", "Aksi"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <p className="empty-state-text">Inventory kosong</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paged.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                      <td style={{ padding: "13px 16px" }}>
                        <p style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>{item.app_name}</p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{item.profile_name || "Tanpa Profil"}</p>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>{item.login_email}</span>
                          <CopyButton text={item.login_email} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>••••••••</span>
                          <CopyButton text={item.login_password} />
                        </div>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span className={`badge ${item.status === "Tersedia" ? "badge-ready" : item.status === "Terjual" ? "badge-sold" : "badge-expired"}`}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 11.5, color: "var(--text-secondary)" }}>
                        <p>Restock: {item.restock_date || "-"}</p>
                        <p>Billing: {item.supplier_billing_date || "-"}</p>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.capital_cost ? formatCurrency(item.capital_cost, currency) : "-"}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Tooltip content="Edit">
                            <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><Pencil size={15} /></button>
                          </Tooltip>
                          <Tooltip content="Hapus">
                            <button onClick={() => handleDelete(item.id, item.app_name)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}><Trash2 size={15} /></button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > rowsPerPage && (
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{filtered.length} item ditemukan</span>
              <Pagination isCompact showControls color="secondary" page={page} total={pages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      <Modal backdrop="blur" isOpen={isOpen} placement="center" size="lg" onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(); }} classNames={{ base: "bg-[#111118] border border-white/[0.08]", header: "border-b border-white/[0.06]", footer: "border-t border-white/[0.06]" }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editId ? "Edit Item Inventori" : "Tambah Stok Baru"}</ModalHeader>
              <ModalBody className="py-5 gap-4">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Nama Aplikasi" placeholder="cth. Netflix" value={form.app_name} onValueChange={(v) => setForm(f => ({ ...f, app_name: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                  <Input label="Profil" placeholder="cth. Erna" value={form.profile_name} onValueChange={(v) => setForm(f => ({ ...f, profile_name: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Email Login" value={form.login_email} onValueChange={(v) => setForm(f => ({ ...f, login_email: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                  <Input label="Password Login" value={form.login_password} onValueChange={(v) => setForm(f => ({ ...f, login_password: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Tgl Restock" type="date" value={form.restock_date} onValueChange={(v) => setForm(f => ({ ...f, restock_date: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                  <Input label="Tgl Tagihan Supplier" type="date" value={form.supplier_billing_date} onValueChange={(v) => setForm(f => ({ ...f, supplier_billing_date: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Modal (Rp)" type="number" placeholder="0" value={form.capital_cost} onValueChange={(v) => setForm(f => ({ ...f, capital_cost: v }))} variant="bordered" classNames={{ inputWrapper: "login-input-wrapper" }} />
                  <Select label="Status" selectedKeys={[form.status]} onSelectionChange={(keys) => setForm(f => ({ ...f, status: Array.from(keys)[0] as any }))} variant="bordered" classNames={{ trigger: "login-input-wrapper" }}>
                    {STATUSES.map(s => <SelectItem key={s}>{s}</SelectItem>)}
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" color="danger" onPress={() => { resetForm(); onClose(); }}>Batal</Button>
                <Button
                  isLoading={isLoading}
                  onPress={handleSave}
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "white", fontWeight: 600, paddingLeft: 28, paddingRight: 28 }}
                >
                  {editId ? "Simpan Perubahan" : "Tambah Stok"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
