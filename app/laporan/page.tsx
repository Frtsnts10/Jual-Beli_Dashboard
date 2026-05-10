"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Pagination, Tooltip,
} from "@heroui/react";
import {
  AlertTriangle, CheckCircle2, Clock, Search, MessageSquare, Trash2, Phone, Package,
  ChevronDown, AlertCircle, CheckCheck, XCircle, Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToComplaints, addComplaint, updateComplaint, deleteComplaint,
  type Complaint, type ComplaintStatus,
} from "@/lib/supabase/complaints";
import { useSettings } from "@/context/SettingsContext";

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; icon: React.ElementType; badgeClass: string }> = {
  open:        { label: "Baru",       icon: AlertCircle,   badgeClass: "red" },
  in_progress: { label: "Diproses",   icon: Clock,         badgeClass: "amber" },
  resolved:    { label: "Selesai",    icon: CheckCircle2,  badgeClass: "green" },
};

const EMPTY_FORM = {
  customer_name: "",
  whatsapp_number: "",
  product_name: "",
  complaint_text: "",
  status: "open" as ComplaintStatus,
  seller_notes: "",
};

export default function LaporanPage() {
  const { activeShop } = useSettings();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ComplaintStatus>("all");
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  // Modal states
  const { isOpen: isAddOpen, onOpen: onAddOpen, onOpenChange: onAddChange } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onOpenChange: onDetailChange } = useDisclosure();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    if (!activeShop?.id) return;
    const unsub = subscribeToComplaints(activeShop.id, setComplaints);
    return unsub;
  }, [activeShop?.id]);

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        c.customer_name.toLowerCase().includes(q) ||
        c.product_name.toLowerCase().includes(q) ||
        c.complaint_text.toLowerCase().includes(q) ||
        c.whatsapp_number.includes(q);
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [complaints, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const counts = useMemo(() => ({
    open: complaints.filter(c => c.status === "open").length,
    in_progress: complaints.filter(c => c.status === "in_progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
  }), [complaints]);

  const handleAddComplaint = async () => {
    if (!activeShop?.id) return;
    if (!addForm.customer_name || !addForm.product_name || !addForm.complaint_text) {
      toast.error("Mohon lengkapi nama pelanggan, produk, dan isi laporan");
      return;
    }
    setIsLoading(true);
    try {
      await addComplaint({
        profile_id: activeShop.id,
        customer_name: addForm.customer_name,
        whatsapp_number: addForm.whatsapp_number,
        product_name: addForm.product_name,
        complaint_text: addForm.complaint_text,
        status: "open",
        seller_notes: addForm.seller_notes || null,
      });
      toast.success("Laporan berhasil ditambahkan");
      setAddForm(EMPTY_FORM);
      onAddChange();
    } catch (err: any) {
      toast.error("Gagal: " + err.message);
    } finally { setIsLoading(false); }
  };

  const handleUpdateStatus = async (id: string, status: ComplaintStatus) => {
    try {
      await updateComplaint(id, {
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      });
      if (selectedComplaint?.id === id) setSelectedComplaint(c => c ? { ...c, status } : c);
      toast.success("Status diperbarui");
    } catch { toast.error("Gagal memperbarui status"); }
  };

  const handleSaveNote = async () => {
    if (!selectedComplaint) return;
    try {
      await updateComplaint(selectedComplaint.id, { seller_notes: noteText });
      setSelectedComplaint(c => c ? { ...c, seller_notes: noteText } : c);
      toast.success("Catatan disimpan");
    } catch { toast.error("Gagal menyimpan catatan"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus laporan ini?")) return;
    try {
      await deleteComplaint(id);
      toast.success("Laporan dihapus");
      if (selectedComplaint?.id === id) { setSelectedComplaint(null); onDetailChange(); }
    } catch { toast.error("Gagal menghapus"); }
  };

  const openDetail = (c: Complaint) => {
    setSelectedComplaint(c);
    setNoteText(c.seller_notes || "");
    onDetailOpen();
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Laporan & Keluhan</h1>
        <p className="page-subtitle">Kelola laporan dan keluhan pelanggan dari sini</p>
      </div>

      <div className="page-content">

        {/* Summary Cards */}
        <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 20 }}>
          {(["open", "in_progress", "resolved"] as ComplaintStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <div
                key={s}
                className="stat-card"
                style={{ cursor: "pointer", opacity: statusFilter === s ? 1 : 0.7 }}
                onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              >
                <div className={`stat-icon stat-icon-${cfg.badgeClass === "red" ? "red" : cfg.badgeClass === "amber" ? "amber" : "green"}`}>
                  <Icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="stat-label">{cfg.label}</p>
                  <p className="stat-value">{counts[s]}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table Card */}
        <div className="glass-card">
          {/* Toolbar */}
          <div className="table-toolbar">
            <div className="table-toolbar-left">
              <div className="search-box">
                <Search size={15} className="search-icon" />
                <input
                  className="search-input"
                  placeholder="Cari pelanggan, produk, keluhan..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <div className="filter-tabs">
                {([["all", "Semua"], ["open", "Baru"], ["in_progress", "Diproses"], ["resolved", "Selesai"]] as [string, string][]).map(([val, lbl]) => (
                  <button
                    key={val}
                    className={`filter-tab ${statusFilter === val ? "active" : ""}`}
                    onClick={() => { setStatusFilter(val as any); setPage(1); }}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div className="table-toolbar-right">
              <button className="btn-primary" onClick={onAddOpen}>
                <Plus size={16} /> Tambah Laporan
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Produk</th>
                  <th>Keluhan</th>
                  <th>Status</th>
                  <th>Waktu</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">✅</div>
                        <p className="empty-state-text">Tidak ada laporan masuk</p>
                      </div>
                    </td>
                  </tr>
                ) : paged.map(c => {
                  const cfg = STATUS_CONFIG[c.status];
                  return (
                    <tr key={c.id} className="data-row" style={{ cursor: "pointer" }} onClick={() => openDetail(c)}>
                      <td>
                        <p className="cell-primary">{c.customer_name}</p>
                        {c.whatsapp_number && (
                          <p className="cell-secondary" style={{ fontSize: 11 }}>
                            📞 {c.whatsapp_number}
                          </p>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Package size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                          <span className="cell-primary">{c.product_name}</span>
                        </div>
                      </td>
                      <td>
                        <p className="cell-secondary" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.complaint_text}
                        </p>
                      </td>
                      <td>
                        <span className={`status-badge ${cfg.badgeClass}`}>{cfg.label}</span>
                      </td>
                      <td>
                        <p className="cell-secondary" style={{ fontSize: 12 }}>
                          {new Date(c.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="cell-secondary" style={{ fontSize: 11 }}>
                          {new Date(c.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="cell-actions">
                          <Tooltip content="Lihat Detail" color="secondary" size="sm">
                            <button className="action-btn" onClick={() => openDetail(c)}><MessageSquare size={14} /></button>
                          </Tooltip>
                          <Tooltip content="Hapus" color="danger" size="sm">
                            <button className="action-btn danger" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
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
              <span className="table-count">{filtered.length} laporan ditemukan</span>
              <Pagination isCompact showControls color="secondary" page={page} total={totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      </div>

      {/* Add Complaint Modal */}
      <Modal
        backdrop="blur"
        isOpen={isAddOpen}
        onOpenChange={onAddChange}
        placement="center"
        size="lg"
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
                  <div className="modal-icon red"><AlertTriangle size={18} /></div>
                  <div>
                    <h2 className="modal-title">Tambah Laporan Baru</h2>
                    <p className="modal-subtitle">Catat keluhan atau laporan dari pelanggan</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="modal-form-body">
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon purple"><MessageSquare size={11} /></div>
                      <p className="modal-section-label">Informasi Pelanggan</p>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-field">
                        <label className="form-label">Nama Pelanggan <span className="form-required">*</span></label>
                        <input className="form-input" placeholder="Nama pelanggan" value={addForm.customer_name} onChange={e => setAddForm(f => ({ ...f, customer_name: e.target.value }))} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">WhatsApp <span className="form-optional">Opsional</span></label>
                        <input className="form-input" placeholder="08xx-xxxx-xxxx" value={addForm.whatsapp_number} onChange={e => setAddForm(f => ({ ...f, whatsapp_number: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Produk / Layanan <span className="form-required">*</span></label>
                      <input className="form-input" placeholder="Nama produk yang bermasalah" value={addForm.product_name} onChange={e => setAddForm(f => ({ ...f, product_name: e.target.value }))} />
                    </div>
                  </div>

                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon red"><AlertCircle size={11} /></div>
                      <p className="modal-section-label">Detail Keluhan</p>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Isi Laporan <span className="form-required">*</span></label>
                      <textarea
                        className="form-input"
                        style={{ minHeight: 100, resize: "vertical" }}
                        placeholder="Jelaskan masalah yang dialami pelanggan..."
                        value={addForm.complaint_text}
                        onChange={e => setAddForm(f => ({ ...f, complaint_text: e.target.value }))}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Catatan Penjual <span className="form-optional">Opsional</span></label>
                      <input className="form-input" placeholder="Catatan internal (tidak terlihat pelanggan)" value={addForm.seller_notes} onChange={e => setAddForm(f => ({ ...f, seller_notes: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <button className="modal-btn-secondary" onClick={() => { setAddForm(EMPTY_FORM); onClose(); }}>Batal</button>
                <button disabled={isLoading} onClick={handleAddComplaint} className="modal-btn-primary">
                  {isLoading ? "Menyimpan..." : "Tambah Laporan"}
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Detail / Handle Complaint Modal */}
      <Modal
        backdrop="blur"
        isOpen={isDetailOpen}
        onOpenChange={onDetailChange}
        placement="center"
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => selectedComplaint && (
            <>
              <ModalHeader>
                <div className="modal-header-inner">
                  <div className={`modal-icon ${selectedComplaint.status === "resolved" ? "green" : selectedComplaint.status === "in_progress" ? "amber" : "red"}`}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h2 className="modal-title">Detail Laporan</h2>
                    <p className="modal-subtitle">{selectedComplaint.customer_name} · {selectedComplaint.product_name}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="modal-form-body">
                  {/* Customer info */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon purple"><MessageSquare size={11} /></div>
                      <p className="modal-section-label">Informasi Pelanggan</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Nama</p>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{selectedComplaint.customer_name}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>WhatsApp</p>
                        {selectedComplaint.whatsapp_number ? (
                          <a
                            href={`https://wa.me/${selectedComplaint.whatsapp_number.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 14, color: "#25d366", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
                          >
                            <Phone size={13} /> {selectedComplaint.whatsapp_number}
                          </a>
                        ) : (
                          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>—</p>
                        )}
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Produk</p>
                        <p style={{ fontSize: 14, fontWeight: 600 }}>{selectedComplaint.product_name}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Diterima</p>
                        <p style={{ fontSize: 14 }}>{new Date(selectedComplaint.created_at).toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Complaint text */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon red"><AlertCircle size={11} /></div>
                      <p className="modal-section-label">Isi Keluhan</p>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)", borderRadius: 10, padding: "14px 16px" }}>
                      {selectedComplaint.complaint_text}
                    </p>
                  </div>

                  {/* Status update */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon amber"><Clock size={11} /></div>
                      <p className="modal-section-label">Update Status</p>
                    </div>
                    <div className="slot-pills">
                      {(["open", "in_progress", "resolved"] as ComplaintStatus[]).map(s => {
                        const cfg = STATUS_CONFIG[s];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={s}
                            type="button"
                            className={`slot-pill ${selectedComplaint.status === s ? `active complaint-status-${s}` : ""}`}
                            onClick={() => handleUpdateStatus(selectedComplaint.id, s)}
                          >
                            <Icon size={12} style={{ display: "inline", marginRight: 4 }} />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Seller notes */}
                  <div className="modal-section">
                    <div className="modal-section-header">
                      <div className="modal-section-icon green"><CheckCheck size={11} /></div>
                      <p className="modal-section-label">Catatan Penanganan</p>
                    </div>
                    <div className="form-field">
                      <textarea
                        className="form-input"
                        style={{ minHeight: 90, resize: "vertical" }}
                        placeholder="Tulis catatan penanganan, solusi yang diberikan, dll..."
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                      />
                    </div>
                    <button className="modal-btn-primary" style={{ width: "100%" }} onClick={handleSaveNote}>
                      Simpan Catatan
                    </button>
                  </div>

                </div>
              </ModalBody>
              <ModalFooter>
                <button className="modal-btn-secondary danger-btn" onClick={() => handleDelete(selectedComplaint.id)}>
                  <Trash2 size={14} style={{ display: "inline", marginRight: 6 }} />Hapus Laporan
                </button>
                <button className="modal-btn-secondary" onClick={onClose}>Tutup</button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
