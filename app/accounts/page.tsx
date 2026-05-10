"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  Select,
  SelectItem,
  Textarea,
  Tooltip,
} from "@heroui/react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ShieldAlert,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToAccounts,
  addAccount,
  addAccounts,
  updateAccount,
  deleteAccount,
  type Account,
} from "@/lib/supabase/accounts";
import { useRef } from "react";

const STATUSES = ["Ready", "Sold", "Expired"] as const;

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  status: "Ready" as Account["status"],
  expiry_date: "",
  price: "",
  buyer_name: "",
  buyer_wa: "",
  notes: "",
  duration: "",
  plan: "",
  order_date: "",
  received_date: "",
  device_type: "",
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowsPerPage = 10;

  useEffect(() => {
    const unsub = subscribeToAccounts(setAccounts);
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const matchSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (a.buyer_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [accounts, search, statusFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paged = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [page, filtered]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowPassword(false);
  };

  const openAdd = () => {
    resetForm();
    onOpen();
  };

  const openEdit = (acc: Account) => {
    setEditId(acc.id);
    setForm({
      name: acc.name,
      email: acc.email ?? "",
      password: acc.password ?? "",
      status: acc.status,
      expiry_date: acc.expiry_date ?? "",
      price: acc.price?.toString() ?? "",
      buyer_name: acc.buyer_name ?? "",
      buyer_wa: acc.buyer_wa ?? "",
      notes: acc.notes ?? "",
      duration: acc.duration ?? "",
      plan: acc.plan ?? "",
      order_date: acc.order_date ?? "",
      received_date: acc.received_date ?? "",
      device_type: acc.device_type ?? "",
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nama akun wajib diisi");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email || null,
        password: form.password || null,
        status: form.status,
        expiry_date: form.expiry_date || null,
        price: form.price ? parseFloat(form.price) : null,
        buyer_name: form.buyer_name || null,
        buyer_wa: form.buyer_wa || null,
        notes: form.notes || null,
        duration: form.duration || null,
        plan: form.plan || null,
        order_date: form.order_date || null,
        received_date: form.received_date || null,
        device_type: form.device_type || null,
      };
      if (editId) {
        await updateAccount(editId, payload);
        toast.success("Akun berhasil diperbarui");
      } else {
        await addAccount(payload);
        toast.success("Akun berhasil ditambahkan");
      }
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + (err.message ?? "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus akun "${name}"?`)) return;
    try {
      await deleteAccount(id);
      toast.success("Akun dihapus");
    } catch (err: any) {
      toast.error("Gagal menghapus");
    }
  };

  const handleWarranty = async (acc: Account) => {
    if (!confirm(`Proses garansi untuk akun "${acc.name}"? Status akan direset ke Ready.`)) return;
    try {
      await updateAccount(acc.id, {
        status: "Ready",
        buyer_name: null,
        buyer_wa: null,
        notes: `[Warranty] ${new Date().toLocaleDateString("id-ID")}`,
      });
      toast.success("Garansi diproses — akun di-reset ke Ready");
    } catch {
      toast.error("Gagal memproses garansi");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Library Excel belum siap, silakan tunggu sebentar atau refresh halaman.");
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

        const mapped: Omit<Account, "id" | "created_at">[] = data.map((row) => ({
          buyer_name: row["customer name"] || row["Nama Pelanggan"] || row["USERNAME"] || null,
          buyer_wa: row["phone number"] || row["Nomor WA"] || row["USERNAME"] || null,
          name: row["app"] || row["Aplikasi"] || "Netflix",
          duration: row["duration"] || row["Durasi"] || row["DURASI"] || null,
          plan: row["plan selected"] || row["Paket"] || row["JENIS"] || null,
          email: row["EMAIL"] || row["Email"] || null,
          password: row["Password"] || row["password"] || null,
          notes: row["PROFILE"] || row["Catatan"] || row["notes"] || null,
          order_date: row["date order"] || row["Tanggal Order"] || row["TANGGAL ORDER"] || null,
          received_date: row["date received"] || row["Tanggal Diterima"] || null,
          expiry_date: row["expiry date"] || row["Tanggal Habis"] || row["TANGGAL HABIS"] || null,
          device_type: row["device"] || row["Jenis Device"] || row["JENIS DEVICE"] || null,
          status: (row.Status || row.status || "Sold") as Account["status"],
          price: row.Harga || row.price ? parseFloat(row.Harga || row.price) : 0,
        }));

        if (mapped.length === 0) {
          toast.error("File kosong atau format salah");
          return;
        }

        await addAccounts(mapped);
        toast.success(`${mapped.length} akun berhasil diimpor`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: any) {
        toast.error("Gagal impor: " + err.message);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExport = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Library Excel belum siap, silakan tunggu sebentar.");
      return;
    }
    try {
      if (accounts.length === 0) {
        toast.error("Tidak ada data untuk diekspor");
        return;
      }

      const exportData = accounts.map((acc) => ({
        "Customer Name": acc.buyer_name,
        "Phone Number": acc.buyer_wa,
        "App": acc.name,
        "Duration": acc.duration,
        "Plan Selected": acc.plan,
        "Email": acc.email || "",
        "Password": acc.password || "",
        "Date Order": acc.order_date || "",
        "Date Received": acc.received_date || "",
        "Expiry Date": acc.expiry_date || "",
        "Device": acc.device_type || "",
        "Status": acc.status,
        "Notes": acc.notes || "",
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, "Database Akun");
      XLSX.writeFile(wb, `database_akun_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Data berhasil diekspor");
    } catch (err: any) {
      toast.error("Gagal ekspor: " + err.message);
    }
  };

  const downloadTemplate = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      toast.error("Library Excel belum siap.");
      return;
    }
    const headers = [["customer name", "phone number", "app", "duration", "plan selected", "EMAIL", "PROFILE", "date order", "date received", "expiry date", "device"]];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(headers);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_import_akun.xlsx");
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Manajemen Akun</h1>
        <p className="page-subtitle">
          Kelola stok akun digital — {accounts.length} akun tersimpan
        </p>
      </div>

      <div className="page-content">
        <div className="glass-card">
          {/* Toolbar */}
          <div className="glass-card-header">
            <div className="table-toolbar" style={{ flex: 1 }}>
              <Input
                placeholder="Cari nama, email, pembeli..."
                value={search}
                onValueChange={(v) => { setSearch(v); setPage(1); }}
                startContent={<Search size={16} className="text-gray-400" />}
                size="sm"
                variant="bordered"
                classNames={{ 
                  inputWrapper: "login-input-wrapper table-search-wrapper", 
                  base: "max-w-xs" 
                }}
              />
              <div className="table-actions">
                {(["all", "Ready", "Sold", "Expired"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setPage(1); }}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 99,
                      fontSize: 11.5,
                      fontWeight: 600,
                      border: `1px solid ${statusFilter === s ? "rgba(139,92,246,0.4)" : "var(--border)"}`,
                      background: statusFilter === s ? "rgba(139,92,246,0.12)" : "transparent",
                      color: statusFilter === s ? "#c4b5fd" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {s === "all" ? "Semua" : s}
                  </button>
                ))}

                {/* Divider */}
                <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />

                <button
                  onClick={downloadTemplate}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  Template
                </button>
                <button
                  onClick={handleExport}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  Ekspor
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                  Impor
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                />
                <button
                  onClick={openAdd}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 600,
                    border: "none",
                    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
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
                  Tambah Akun
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Aplikasi / Paket", "Email / Akses", "Status", "Order / Exp", "Pelanggan / Device", "Aksi"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
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
                        <div className="empty-state-icon">🔍</div>
                        <p className="empty-state-text">Tidak ada akun ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paged.map((acc) => (
                    <tr
                      key={acc.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <p style={{ fontWeight: 600, fontSize: 13.5, color: "var(--text-primary)" }}>
                          {acc.name}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {acc.plan || "No Plan"} • {acc.duration || "No Dur"}
                        </p>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {acc.email ? (
                          <div>
                            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
                              {acc.email}
                            </span>
                            <CopyButton text={acc.email} />
                            {acc.password && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                                  ••••••••
                                </span>
                                <CopyButton text={acc.password} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <span className={`badge ${acc.status === "Ready" ? "badge-ready" : acc.status === "Sold" ? "badge-sold" : "badge-expired"}`}>
                          {acc.status}
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                        <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                          {acc.order_date ? new Date(acc.order_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                        </p>
                        <p style={{ fontSize: 11, color: "var(--success)", fontWeight: 500 }}>
                          Exp: {acc.expiry_date ? new Date(acc.expiry_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                        </p>
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        {acc.buyer_name ? (
                          <div>
                            <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{acc.buyer_name}</p>
                            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {acc.device_type || "No Device"}
                            </p>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "13px 16px" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <Tooltip content="Edit">
                            <button
                              onClick={() => openEdit(acc)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#a78bfa")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                            >
                              <Pencil size={15} />
                            </button>
                          </Tooltip>
                          <Tooltip content="One-Click Warranty" placement="top">
                            <button
                              onClick={() => handleWarranty(acc)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--warning)", padding: 4, borderRadius: 6, transition: "opacity 0.15s" }}
                            >
                              <ShieldAlert size={15} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Hapus" color="danger">
                            <button
                              onClick={() => handleDelete(acc.id, acc.name)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 4, borderRadius: 6, opacity: 0.7, transition: "opacity 0.15s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                            >
                              <Trash2 size={15} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > rowsPerPage && (
            <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {filtered.length} akun ditemukan
              </span>
              <Pagination
                isCompact
                showControls
                color="secondary"
                page={page}
                total={pages}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        backdrop="blur"
        isOpen={isOpen}
        placement="center"
        size="lg"
        onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(); }}
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
              <ModalHeader className="!p-6 !border-b !border-white/[0.06]">{editId ? "Edit Akun" : "Tambah Akun Baru"}</ModalHeader>
              <ModalBody className="py-5 gap-4">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input
                    label="Aplikasi (App)"
                    placeholder="cth. Netflix"
                    value={form.name}
                    onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Input
                    label="Paket (Plan)"
                    placeholder="cth. 1 User"
                    value={form.plan}
                    onValueChange={(v) => setForm((f) => ({ ...f, plan: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input
                    label="Durasi"
                    placeholder="cth. 1 Bulan"
                    value={form.duration}
                    onValueChange={(v) => setForm((f) => ({ ...f, duration: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Select
                    label="Status"
                    selectedKeys={[form.status]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as Account["status"];
                      setForm((f) => ({ ...f, status: val }));
                    }}
                    variant="bordered"
                    classNames={{ trigger: "login-input-wrapper" }}
                  >
                    {STATUSES.map((s) => (
                      <SelectItem key={s}>{s}</SelectItem>
                    ))}
                  </Select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input
                    label="Email"
                    placeholder="email@example.com"
                    value={form.email}
                    onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onValueChange={(v) => setForm((f) => ({ ...f, password: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                    endContent={
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <Input
                    label="Tgl Order"
                    type="date"
                    value={form.order_date}
                    onValueChange={(v) => setForm((f) => ({ ...f, order_date: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Input
                    label="Tgl Terima"
                    type="date"
                    value={form.received_date}
                    onValueChange={(v) => setForm((f) => ({ ...f, received_date: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Input
                    label="Tgl Habis"
                    type="date"
                    value={form.expiry_date}
                    onValueChange={(v) => setForm((f) => ({ ...f, expiry_date: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input
                    label="Nama Pelanggan"
                    value={form.buyer_name}
                    onValueChange={(v) => setForm((f) => ({ ...f, buyer_name: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Input
                    label="Nomor WA"
                    placeholder="628xx..."
                    value={form.buyer_wa}
                    onValueChange={(v) => setForm((f) => ({ ...f, buyer_wa: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input
                    label="Jenis Device"
                    placeholder="cth. TV, HP"
                    value={form.device_type}
                    onValueChange={(v) => setForm((f) => ({ ...f, device_type: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                  <Input
                    label="Harga Jual"
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onValueChange={(v) => setForm((f) => ({ ...f, price: v }))}
                    variant="bordered"
                    classNames={{ inputWrapper: "login-input-wrapper" }}
                  />
                </div>

                <Textarea
                  label="Profil / Catatan"
                  placeholder="Profil (erna), Catatan tambahan..."
                  value={form.notes}
                  onValueChange={(v) => setForm((f) => ({ ...f, notes: v }))}
                  variant="bordered"
                  minRows={2}
                  classNames={{ inputWrapper: "login-input-wrapper" }}
                />
              </ModalBody>
              <ModalFooter className="!p-6 !border-t !border-white/[0.06]">
                <Button
                  variant="light"
                  color="danger"
                  onPress={() => { resetForm(); onClose(); }}
                >
                  Batal
                </Button>
                <Button
                  isLoading={isLoading}
                  onPress={handleSave}
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                    color: "white",
                    fontWeight: 600,
                    paddingLeft: 28,
                    paddingRight: 28,
                  }}
                >
                  {editId ? "Simpan Perubahan" : "Tambah Akun"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
