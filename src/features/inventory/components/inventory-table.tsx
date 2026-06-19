"use client";

import React, { useState } from "react";
import { InventoryItem, deleteInventoryItemAction, updateItemGroupingAction, updateInventoryItemAction, importInventoryCsvAction } from "../actions/inventory-actions";
import { InventoryForm } from "./inventory-form";
import { Trash2, Loader2, Key, Calendar, Shield, Users, UserPlus, RefreshCw, Download, Upload, Edit, Copy, CheckCircle, Plus, Package, Sparkles, FileText, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getTierConfigForProduct, formatTierName } from "@/config/product-tiers";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem, Button, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { EditInventoryModal } from "./edit-inventory-modal";
import { useRouter } from "next/navigation";

interface InventoryTableProps {
  storeId: string;
  items: InventoryItem[];
  currency?: string;
  isPremium?: boolean;
}

function CopyableCredential({
  value,
  label,
  isPassword,
  isTiny,
}: {
  value: string;
  label: "Email" | "Password" | "PIN";
  isPassword?: boolean;
  isTiny?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied hingga clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group inline-flex item-center gap-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-1.5 py-0.5 rounded transition-all relative active:scale-95 max-w-full ${
        isTiny ? "text-[9px] font-mono" : "text-[11px] font-mono"
      } ${
        isPassword
          ? "text-slate-700 dark:text-slate-300 font-bold"
          : "text-slate-600 dark:text-slate-400 font-medium"
      }`}
      title={`Click hingga copy ${label}`}
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 animate-in zoom-in duration-150" />
      ) : (
        <Copy className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}

export function InventoryTable({ storeId, items, currency = "IDR", isPremium = false }: InventoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateConfirmOpen, setIsCreateConfirmOpen] = useState(false);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [currentFamilyPage, setCurrentFamilyPage] = useState(1);
  const [currentSoloPage, setCurrentSoloPage] = useState(1);
  const [isFamilyTransitioning, setIsFamilyTransitioning] = useState(false);
  const [isSoloTransitioning, setIsSoloTransitioning] = useState(false);

  const handleFamilyPageChange = (p: number) => {
    setIsFamilyTransitioning(true);
    setCurrentFamilyPage(p);
    setTimeout(() => setIsFamilyTransitioning(false), 150);
  };

  const handleSoloPageChange = (p: number) => {
    setIsSoloTransitioning(true);
    setCurrentSoloPage(p);
    setTimeout(() => setIsSoloTransitioning(false), 150);
  };

  const formatCustomPrice = (amount: number) => {
    if (currency.toUpperCase() === "IDR") {
      const formatted = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
      return `IDR ${formatted}`;
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeletingId(deleteConfirmId);
    await deleteInventoryItemAction(storeId, deleteConfirmId);
    setDeletingId(null);
    setDeleteConfirmId(null);
    toast.success("Variant record purged from digital workspace memory");
  };

  const handleGroupChange = async (itemId: string, currentGroup?: string | null) => {
    const nextGroup = prompt(
      "Enter target Family Pool string (e.g. 'YouTube Family Hub Alpha'). Leave blank hingga set as Independent Solo Variant:",
      currentGroup || ""
    );
    if (nextGroup === null) return; // cancelled

    setUpdatingId(itemId);
    await updateItemGroupingAction(storeId, itemId, nextGroup.trim() || null);
    setUpdatingId(null);
    toast.success("Pool assignment partition re-routed successfully");
  };

  const downloadProductTemplat = () => {
    const headers = "name;profile_tier;profile_name;email;password;pin;base_price;selling_price;stock;group_name\n";
    const example = "Netflix Matrix;1user;test-a;account@domain.com;pass123;1234;12.00;19.99;1;Family Pool Alpha\n";
    const blob = new Blob([headers + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportData = (data: InventoryItem[], filename: string) => {
    const headers = "name;profile_tier;profile_name;email;password;pin;base_price;selling_price;stock;group_name;date_buy;date_expired\n";
    const rows = data.map(item => 
      `${item.name};${item.profile_tier || ""};${item.profile_name || ""};${item.email || ""};${item.password || ""};${item.pin || ""};${item.base_price};${item.selling_price};${item.stock};${item.group_name || ""};${item.date_buy || ""};${item.date_expired || ""}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPremium) {
      toast.error("Bulk CSV Import is locked under the Standard plan. Upgrade hingga Shop Dashboard Pro hingga activate catalog uploads!");
      e.target.value = "";
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error("File content is empty");

        const lines = text.split(/\r\n|\n/).filter((l) => l.trim());
        if (lines.length < 2) throw new Error("CSV requires headers and at least one record row");

        const delimiter = lines[0].includes(";") ? ";" : ",";
        const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

        const rows = lines.slice(1).map((line) => {
          const values = line.split(delimiter).map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, idx) => {
            obj[h] = values[idx] !== undefined ? values[idx] : "";
          });
          return obj;
        });

        const res = await importInventoryCsvAction(storeId, rows);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success(`Successfully imported ${res?.count || rows.length} inventory asset item!`);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed hingga parse CSV file");
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Failed hingga read file storage");
      setIsImporting(false);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const itemPerPage = 10;
  const totalPages = Math.ceil(items.length / itemPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const handlePageChange = (p: number) => {
    setIsTransitioning(true);
    setCurrentPage(p);
    setTimeout(() => setIsTransitioning(false), 150);
  };
  const startIndex = (currentPage - 1) * itemPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemPerPage);
  
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSync = () => {
    setIsSyncing(true);
    router.refresh();
    setTimeout(() => setIsSyncing(false), 600);
  };
  return (
    <div className="space-y-8 font-sans">
      {/* Top Controller Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="h-[38px] flex item-center justify-center text-xs font-bold px-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100/40 dark:border-indigo-900/40">
            {items.length} Total Inventaris Toko
          </span>
        </div>
        <div className="flex flex-wrap item-center gap-3">
          <Button 
            size="sm" 
            className="h-[38px] bg-[#242b4d] hover:bg-[#2c345d] text-[#7daaf2] font-bold tracking-wide text-xs px-3"
            onPress={handleSync}
            isDisabled={isSyncing}
            startContent={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />}
          >
            SINKRONISASI DATA LANGSUNG
          </Button>
          
          <Button
            onPress={downloadProductTemplat}
            variant="flat"
            className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 h-10 px-4"
            startContent={<FileText className="w-4 h-4" />}
          >
            Templat
          </Button>

          <label className="h-10 flex item-center justify-center px-4 font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm transition-all gap-2 cursor-pointer">
            <Upload className="w-4 h-4" /> Impor CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} disabled={isImporting} className="hidden" />
          </label>

          <Button
            onPress={() => exportData(items, "inventory_export.csv")}
            variant="flat"
            className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 h-10 px-4"
            startContent={<Download className="w-4 h-4" />}
          >
            Ekspor
          </Button>

          <Button
            onPress={() => {
              if (!isPremium && items.length >= 3) {
                toast.error("Standard Tier Quota Exceeded! Please upgrade hingga Pro hingga add more item.", {
                  action: {
                    label: "Upgrade",
                    onClick: () => window.location.href = `/${storeId}/subscription`
                  }
                });
              } else {
                setIsCreateModalOpen(true);
              }
            }}
            color="primary"
            className="font-bold shadow-md h-10 px-4 ml-auto"
            startContent={<Plus className="w-4 h-4" />}
          >
            Tambah Baris Inventaris
          </Button>
        </div>
      </div>

      {/* Premium Inventory Quota Cap Banner */}
      {!isPremium && items.length >= 3 && (
        <div className="p-4 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-indigo-500/10 border border-indigo-500/20 dark:border-indigo-900/40 rounded-lg flex flex-col sm:flex-row item-start sm:items-center justify-between gap-4 text-indigo-950 dark:text-indigo-300 shadow-sm animate-in fade-in duration-300">
          <div className="space-y-1">
            <p className="text-xs font-extrabold flex item-center gap-1.5 uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              Standard Toko Quota Exceeded (3/3 items allocated)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Standard tier workspaces are capped at 3 active digital products. Upgrade hingga Pro Matrix Level hingga ingest unlimited SKUs, run bulk CSV imports, and activate automated SLA credentials sync.
            </p>
          </div>
          <a
            href={`/${storeId}/subscription`}
            className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[11px] font-black uppercase tracking-wider rounded-lg shadow-sm transition-all"
          >
            Upgrade hingga Pro
          </a>
        </div>
      )}

      {/* Dynamic Creation Modal Embed */}
      <Modal backdrop="blur" isOpen={isCreateModalOpen} onOpenChange={(open) => {
        if (!open) setIsCreateConfirmOpen(true);
        else setIsCreateModalOpen(true);
      }} size="4xl" scrollBehavior="inside" classNames={{
        base: "bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-2xl",
        body: "p-0"
      }}>
        <ModalContent>
          <ModalBody>
            <InventoryForm 
              storeId={storeId} 
              currency={currency} 
              onSuccess={() => setIsCreateModalOpen(false)} 
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <ConfirmModal
        isOpen={isCreateConfirmOpen}
        onClose={() => setIsCreateConfirmOpen(false)}
        onConfirm={() => {
          setIsCreateConfirmOpen(false);
          setIsCreateModalOpen(false);
        }}
        title="Buang Varian Baru"
        description="Apakah Anda yakin ingin menutup formulir ini? Data yang belum disimpan akan hilang permanen."
        confirmText="Buang"
      />

      {/* Unified Product Inventory Array */}
      <div className="space-y-8 pt-4">
        <div className="bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#0b0f19]/80 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[140px]">Product Asset</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[120px]">Profile Designation</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[150px]">Delivery Credentials</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[120px]">Pricing Matrix</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider min-w-[130px]">Lifecycle Target</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right min-w-[120px]">Controls</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-50 dark:divide-slate-800/60 transition-all duration-150 ${isTransitioning ? "opacity-30 blur-[1px] scale-[0.99]" : ""}`}>
                {paginatedItems.map((item) => {
                  const isDeleting = deletingId === item.id;
                  const isUpdating = updatingId === item.id;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex item-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.name}</span>
                          {item.profile_tier && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wide">
                              {item.profile_tier}
                            </span>
                          )}
                        </div>
                        <div className="flex item-center gap-1.5 mt-1 text-[10px] text-slate-400">
                          <Shield className="w-3 h-3" />
                          <span>Stok: {item.stock}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-[11px]">
                          {item.profile_name || "Belum Ditugaskan"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 space-y-1.5">
                        {item.email ? (
                          <div className="block">
                            <CopyableCredential value={item.email} label="Email" />
                          </div>
                        ) : null}
                        {item.password ? (
                          <div className="flex flex-wrap item-center gap-1.5">
                            <span className="text-[10px] text-slate-400 select-none">🔑</span>
                            <CopyableCredential value={item.password} label="Password" isPassword />
                            {item.pin && (
                              <span className="inline-flex item-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[9px]">
                                PIN: <CopyableCredential value={item.pin} label="PIN" isTiny />
                              </span>
                            )}
                          </div>
                        ) : null}
                        {!item.email && !item.password && <span className="text-slate-300 italic text-[11px] font-sans">Tidak ada kredensial</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex item-baseline gap-1.5">
                          <span className="text-sm font-black text-emerald-600">
                            {formatCustomPrice(Number(item.selling_price || item.price || 0))}
                          </span>
                          {item.base_price > 0 && (
                            <span className="text-[10px] line-through text-slate-400">
                              {formatCustomPrice(Number(item.base_price))} Base
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-500">
                        <div className="flex item-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Buy: {item.date_buy || "N/A"}</span>
                        </div>
                        <div className="flex item-center gap-1 mt-0.5">
                          <span className="w-3 text-center text-slate-300">↳</span>
                          <span className="text-red-500 font-medium">Exp: {item.date_expired || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onPress={() => setEditingItem(item)}
                          isDisabled={isDeleting || isUpdating}
                          className="h-7 w-7 min-w-0 text-slate-400 data-[hover=true]:text-indigo-600 dark:data-[hover=true]:text-indigo-400 data-[hover=true]:bg-indigo-50 dark:data-[hover=true]:bg-indigo-950/40"
                          title="Edit item profile parameters"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onPress={() => setDeleteConfirmId(item.id)}
                          isDisabled={isDeleting}
                          className="h-7 w-7 min-w-0 text-slate-400 data-[hover=true]:text-red-600 dark:data-[hover=true]:text-red-400 data-[hover=true]:bg-red-50 dark:data-[hover=true]:bg-red-950/40"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 italic">
                      No products found. Add your first digital inventory row.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 bg-slate-50/50 dark:bg-[#0b0f19]/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row item-center justify-between gap-2 text-xs transition-colors">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Menampilkan <strong className="text-slate-700 dark:text-slate-200">{startIndex + 1}</strong> to{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {Math.min(startIndex + itemPerPage, items.length)}
                </strong>{" "}
                dari <strong className="text-slate-700 dark:text-slate-200">{items.length}</strong> item
              </span>
              <div className="flex item-center gap-1">
                <Button
                  variant="bordered"
                  radius="lg"
                  onPress={() => handlePageChange(Math.max(1, currentPage - 1))}
                  isDisabled={currentPage === 1}
                  className="h-[26px] min-w-0 px-2.5 font-bold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                >
                  Seb
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "solid" : "bordered"}
                    color={currentPage === page ? "primary" : "default"}
                    radius="lg"
                    onPress={() => handlePageChange(page)}
                    className={`h-[26px] min-w-[26px] px-0 font-bold ${
                      currentPage === page ? "shadow-xs" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="bordered"
                  radius="lg"
                  onPress={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  isDisabled={currentPage === totalPages}
                  className="h-[26px] min-w-0 px-2.5 font-bold text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                >
                  Lanjut
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {editingItem && (
        <EditInventoryModal
          item={editingItem}
          storeId={storeId}
          currency={currency}
          onClose={() => setEditingItem(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Inventory Variant"
        description="Are you sure you want hingga permanently delete this inventory asset? This action cannot be undone."
        confirmText="Purge Variant"
        danger
      />
    </div>
  );
}


