"use client";

import React, { useState } from "react";
import { InventoryItem, deleteInventoryItemAction, updateItemGroupingAction, updateInventoryItemAction, importInventoryCsvAction } from "../actions/inventory-actions";
import { InventoryForm } from "./inventory-form";
import { Trash2, Loader2, Key, Calendar, Shield, Users, UserPlus, UserMinus, RefreshCw, Download, Upload, Edit, Copy, CheckCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { getTierConfigForProduct } from "@/config/product-tiers";
import { Select, ListBox, ListBoxItem } from "@heroui/react";

interface InventoryTableProps {
  storeId: string;
  items: InventoryItem[];
  currency?: string;
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
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`group inline-flex items-center gap-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 px-1.5 py-0.5 rounded transition-all relative active:scale-95 max-w-full ${
        isTiny ? "text-[9px] font-mono" : "text-[11px] font-mono"
      } ${
        isPassword
          ? "text-slate-700 dark:text-slate-300 font-bold"
          : "text-slate-600 dark:text-slate-400 font-medium"
      }`}
      title={`Click to copy ${label}`}
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

export function InventoryTable({ storeId, items, currency = "USD" }: InventoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteInventoryItemAction(storeId, id);
    setDeletingId(null);
    toast.success("Variant record purged from digital workspace memory");
  };

  const handleGroupChange = async (itemId: string, currentGroup?: string | null) => {
    const nextGroup = prompt(
      "Enter target Family Pool string (e.g. 'YouTube Family Hub Alpha'). Leave blank to set as Independent Solo Variant:",
      currentGroup || ""
    );
    if (nextGroup === null) return; // cancelled

    setUpdatingId(itemId);
    await updateItemGroupingAction(storeId, itemId, nextGroup.trim() || null);
    setUpdatingId(null);
    toast.success("Pool assignment partition re-routed successfully");
  };

  const downloadProductTemplate = () => {
    const headers = "name;profile_tier;profile_name;email;password;pin;base_price;selling_price;stock\n";
    const example = "Netflix Matrix;1user;test-a;account@domain.com;pass123;1234;12.00;19.99;1\n";
    const blob = new Blob([headers + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          toast.success(`Successfully imported ${res?.count || rows.length} inventory asset items!`);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to parse CSV file");
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read file storage");
      setIsImporting(false);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  // Extract unique group names to compile Family Pools
  const groupedItems = items.reduce((acc, item) => {
    if (item.group_name) {
      if (!acc[item.group_name]) acc[item.group_name] = [];
      acc[item.group_name].push(item);
    }
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Independent items without designated group pools
  const ungroupedItems = items.filter((item) => !item.group_name);

  const itemsPerPage = 5;
  const groupedEntries = Object.entries(groupedItems);
  const totalFamilyPages = Math.ceil(groupedEntries.length / itemsPerPage);
  const startFamilyIndex = (currentFamilyPage - 1) * itemsPerPage;
  const paginatedFamilyGroups = groupedEntries.slice(startFamilyIndex, startFamilyIndex + itemsPerPage);

  const totalSoloPages = Math.ceil(ungroupedItems.length / itemsPerPage);
  const startSoloIndex = (currentSoloPage - 1) * itemsPerPage;
  const paginatedSoloItems = ungroupedItems.slice(startSoloIndex, startSoloIndex + itemsPerPage);

  return (
    <div className="space-y-8 font-sans">
      {/* Top Controller Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-sm">
              {items.length} Total Inventory Shards
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-[34px] px-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-sm text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Digital Inventory Row</span>
          </button>
        </div>
      </div>

      {/* Dynamic Creation Modal Embed */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800/80 rounded-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-7 h-7 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-sm flex items-center justify-center transition-colors text-base font-bold"
            >
              ×
            </button>
            <div className="pt-2">
              <InventoryForm 
                storeId={storeId} 
                currency={currency} 
                onSuccess={() => setIsCreateModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: Family Pools Hub (Grouped View) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Family Pool Allocation Nodes (Shared Shard Grouping)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-allocated pool constraints map 5 or 6 member profiles natively per master partition.
          </p>
        </div>

        {groupedEntries.length > 0 ? (
          <div className={`grid grid-cols-1 gap-5 transition-all duration-150 ${isFamilyTransitioning ? "opacity-30 blur-[1px] scale-[0.99]" : ""}`}>
            {paginatedFamilyGroups.map(([groupName, groupMembers]) => {
              const maxCapacity = groupName.toLowerCase().includes("netflix") ? 5 : 6;
              const isFull = groupMembers.length >= maxCapacity;

              return (
                <div
                  key={groupName}
                  className="bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all hover:border-indigo-200 dark:hover:border-slate-700"
                >
                  {/* Pool Card Header */}
                  <div className="bg-gradient-to-r from-indigo-50/50 dark:from-indigo-950/20 to-slate-50 dark:to-[#0b0f19] px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                      <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-300 tracking-tight">{groupName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-black tracking-wider ${
                        isFull ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400" : "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300"
                      }`}>
                        Occupancy: {groupMembers.length} / {maxCapacity} Profiles
                      </span>
                    </div>
                  </div>

                  {/* Nested Member Rows */}
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/30 dark:bg-[#0b0f19]/80 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-2">Member Reference</th>
                          <th className="px-4 py-2">Designation</th>
                          <th className="px-4 py-2">Credentials mapped</th>
                          <th className="px-4 py-2">Lifecycle Target</th>
                          <th className="px-4 py-2 text-right">Pool Controls</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {groupMembers.map((member) => {
                          const isUpdating = updatingId === member.id;
                          const isDeleting = deletingId === member.id;

                          return (
                            <tr key={member.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                              <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                                {member.name}{" "}
                                {member.profile_tier && (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal ml-1">
                                    {member.profile_tier}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                                  {member.profile_name || "Slot Anonymous"}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 space-y-1">
                                {member.email ? (
                                  <div className="block">
                                    <CopyableCredential value={member.email} label="Email" />
                                  </div>
                                ) : (
                                  <span className="text-slate-400 block text-[10px] italic font-sans">No email</span>
                                )}
                                {member.password && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-slate-400 select-none">🔑</span>
                                    <CopyableCredential value={member.password} label="Password" isPassword />
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-[10px] text-slate-400">
                                Exp: {member.date_expired || "Rolling"}
                              </td>
                              <td className="px-4 py-2.5 text-right space-x-1">
                                <button
                                  onClick={() => handleGroupChange(member.id, member.group_name)}
                                  disabled={isUpdating}
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-400 rounded-sm text-[9px] font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1"
                                  title="Change family pool group target"
                                >
                                  {isUpdating ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <RefreshCw className="w-2.5 h-2.5" />}
                                  Re-Assign
                                </button>
                                <button
                                  onClick={() => setEditingItem(member)}
                                  disabled={isDeleting || isUpdating}
                                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-sm transition-colors disabled:opacity-50"
                                  title="Edit item profile parameters"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(member.id)}
                                  disabled={isDeleting}
                                  className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-sm transition-colors disabled:opacity-50"
                                >
                                  {isDeleting ? <Loader2 className="w-3 h-3 animate-spin text-red-600" /> : <Trash2 className="w-3 h-3" />}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 bg-slate-50/50 dark:bg-[#0b0f19]/50 rounded-sm border border-slate-200/60 dark:border-slate-800/80 text-center italic text-xs text-slate-400">
            No family-based pool slots assigned. Create Google, YouTube, or Canva items to trigger bucket allocation logic.
          </div>
        )}

        {totalFamilyPages > 1 && (
          <div className="px-5 py-3 bg-slate-50/50 dark:bg-[#0b0f19]/50 border border-slate-100 dark:border-slate-800 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-2 text-xs transition-colors">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Showing Family Pools <strong className="text-slate-700 dark:text-slate-200">{startFamilyIndex + 1}</strong> to{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {Math.min(startFamilyIndex + itemsPerPage, groupedEntries.length)}
              </strong>{" "}
              of <strong className="text-slate-700 dark:text-slate-200">{groupedEntries.length}</strong> master groups
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleFamilyPageChange(Math.max(1, currentFamilyPage - 1))}
                disabled={currentFamilyPage === 1}
                className="px-2.5 py-1 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: totalFamilyPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handleFamilyPageChange(page)}
                  className={`w-7 h-7 font-bold rounded-sm transition-all flex items-center justify-center ${
                    currentFamilyPage === page
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleFamilyPageChange(Math.min(totalFamilyPages, currentFamilyPage + 1))}
                disabled={currentFamilyPage === totalFamilyPages}
                className="px-2.5 py-1 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Independent Assets List */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Independent Resale Array (Solo Variants & Base Accounts)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual streaming items operating outside strict family slot pooling constraints.
          </p>
        </div>

        <div className="bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-[#0b0f19]/80 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asset Variant</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Designation</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Credentials</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pricing Matrix</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifecycle Target</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Pool Router</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-50 dark:divide-slate-800/60 transition-all duration-150 ${isSoloTransitioning ? "opacity-30 blur-[1px] scale-[0.99]" : ""}`}>
                {paginatedSoloItems.map((item) => {
                  const isDeleting = deletingId === item.id;
                  const isUpdating = updatingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{item.name}</span>
                          {item.profile_tier && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wide">
                              {item.profile_tier}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                          <Shield className="w-3 h-3" />
                          <span>Stock: {item.stock}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm text-[11px]">
                          {item.profile_name || "Unassigned"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 space-y-1.5">
                        {item.email ? (
                          <div className="block">
                            <CopyableCredential value={item.email} label="Email" />
                          </div>
                        ) : null}
                        {item.password ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 select-none">🔑</span>
                            <CopyableCredential value={item.password} label="Password" isPassword />
                            {item.pin && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded text-[9px]">
                                PIN: <CopyableCredential value={item.pin} label="PIN" isTiny />
                              </span>
                            )}
                          </div>
                        ) : null}
                        {!item.email && !item.password && <span className="text-slate-300 italic text-[11px] font-sans">No credentials</span>}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-baseline gap-1.5">
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
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Buy: {item.date_buy || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="w-3 text-center text-slate-300">↳</span>
                          <span className="text-red-500 font-medium">Exp: {item.date_expired || "N/A"}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleGroupChange(item.id, "")}
                          disabled={isUpdating}
                          className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-sm transition-all disabled:opacity-50 inline-flex items-center gap-1"
                          title="Assign item to shared Family Pool container"
                        >
                          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                          Route to Pool
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          disabled={isDeleting || isUpdating}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-sm transition-colors disabled:opacity-50"
                          title="Edit item profile parameters"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-sm transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {ungroupedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-slate-400 italic">
                      Zero unassigned or solo items available in general digital memory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalSoloPages > 1 && (
            <div className="px-5 py-3 bg-slate-50/50 dark:bg-[#0b0f19]/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs transition-colors">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Showing Solo Items <strong className="text-slate-700 dark:text-slate-200">{startSoloIndex + 1}</strong> to{" "}
                <strong className="text-slate-700 dark:text-slate-200">
                  {Math.min(startSoloIndex + itemsPerPage, ungroupedItems.length)}
                </strong>{" "}
                of <strong className="text-slate-700 dark:text-slate-200">{ungroupedItems.length}</strong> solo rows
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSoloPageChange(Math.max(1, currentSoloPage - 1))}
                  disabled={currentSoloPage === 1}
                  className="px-2.5 py-1 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: totalSoloPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handleSoloPageChange(page)}
                    className={`w-7 h-7 font-bold rounded-sm transition-all flex items-center justify-center ${
                      currentSoloPage === page
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleSoloPageChange(Math.min(totalSoloPages, currentSoloPage + 1))}
                  disabled={currentSoloPage === totalSoloPages}
                  className="px-2.5 py-1 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-sm shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Inventory CSV Template Hub
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Retrieve base payload strings perfectly matched to product variants and profile structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="h-[34px] px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isImporting ? "Parsing..." : "Import CSV Stock"}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isImporting}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={downloadProductTemplate}
            className="h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Product Template CSV
          </button>
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
    </div>
  );
}

function EditInventoryModal({
  item,
  onClose,
  storeId,
  currency = "USD",
}: {
  item: InventoryItem;
  onClose: () => void;
  storeId: string;
  currency?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIDR = currency.toUpperCase() === "IDR";

  const [name, setName] = useState(item.name || "");
  const initialCfg = getTierConfigForProduct(item.name || "");
  const [profileTier, setProfileTier] = useState(item.profile_tier || initialCfg.defaultTier);
  const [tierOptions, setTierOptions] = useState<string[]>(initialCfg.options);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    const cfg = getTierConfigForProduct(val);
    setProfileTier(cfg.defaultTier);
    setTierOptions(cfg.options);
  };

  const [profileName, setProfileName] = useState(item.profile_name || "");
  const [groupName, setGroupName] = useState(item.group_name || "");
  const [email, setEmail] = useState(item.email || "");
  const [password, setPassword] = useState(item.password || "");
  const [pin, setPin] = useState(item.pin || "");
  const [stock, setStock] = useState(item.stock?.toString() || "1");
  const [dateBuy, setDateBuy] = useState(item.date_buy || "");
  const [dateExpired, setDateExpired] = useState(item.date_expired || "");

  const formatInitialPrice = (num: number) => {
    if (!num) return "";
    if (isIDR) {
      return new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    }
    return num.toString();
  };

  const [basePriceStr, setBasePriceStr] = useState(formatInitialPrice(item.base_price));
  const [sellingPriceStr, setSellingPriceStr] = useState(formatInitialPrice(item.selling_price || item.price));

  const parsePriceFloat = (str: string) => {
    if (!str) return 0;
    let s = str.trim();
    if (isIDR) {
      s = s.replace(/\./g, "").replace(/,/g, ".");
    } else {
      s = s.replace(/,/g, "");
    }
    const f = parseFloat(s);
    return isNaN(f) ? 0 : f;
  };

  const handlePriceBlur = (setter: React.Dispatch<React.SetStateAction<string>>, currentStr: string) => {
    if (!currentStr) return;
    const val = parsePriceFloat(currentStr);
    if (val === 0) return;
    if (isIDR) {
      setter(
        new Intl.NumberFormat("id-ID", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(val)
      );
    } else {
      setter(val.toString());
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("profile_tier", profileTier);
    formData.append("profile_name", profileName);
    formData.append("group_name", groupName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("pin", pin);
    formData.append("stock", stock);
    formData.append("date_buy", dateBuy);
    formData.append("date_expired", dateExpired);
    formData.append("base_price", parsePriceFloat(basePriceStr).toString());
    formData.append("selling_price", parsePriceFloat(sellingPriceStr).toString());

    const res = await updateInventoryItemAction(storeId, item.id, formData);
    setIsPending(false);

    if (res?.error) {
      setError(res.error);
    } else {
      toast.success("Asset profile update broadcasted successfully");
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Edit Asset Variant Profile
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && <div className="p-2 text-xs bg-red-50 text-red-600 rounded font-bold">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
              <input type="text" required value={name} onChange={handleNameChange} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
            </div>
            <div className="flex flex-col justify-end w-full">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tier Variant</label>
              <Select
                aria-label="Tier Variant"
                placeholder="Select variant"
                selectedKey={profileTier || null}
                onSelectionChange={(key) => setProfileTier(key ? key.toString() : "")}
                className="w-full"
              >
                <Select.Trigger className="w-full h-[34px] min-h-[34px] bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm shadow-none flex items-center justify-between px-3 text-xs font-semibold text-slate-800 dark:text-slate-100">
                  <Select.Value />
                </Select.Trigger>
                <Select.Popover style={{ width: "var(--trigger-width)" }} className="bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl z-50 overflow-hidden">
                  <ListBox className="p-1.5 outline-none space-y-0.5 max-h-60 overflow-y-auto">
                    {tierOptions.map((opt) => (
                      <ListBoxItem key={opt} textValue={opt} className="px-2.5 py-1.5 text-xs rounded-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none outline-none transition-colors">
                        {opt}
                      </ListBoxItem>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Designation</label>
              <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Family Pool String</label>
            <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Leave empty for Independent Asset status" className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">PIN</label>
              <input type="text" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Base Price ({currency})</label>
              <input type="text" inputMode="decimal" value={basePriceStr} onChange={(e) => setBasePriceStr(e.target.value)} onBlur={() => handlePriceBlur(setBasePriceStr, basePriceStr)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Selling Price ({currency})</label>
              <input type="text" inputMode="decimal" required value={sellingPriceStr} onChange={(e) => setSellingPriceStr(e.target.value)} onBlur={() => handlePriceBlur(setSellingPriceStr, sellingPriceStr)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Buy</label>
              <input type="date" value={dateBuy} onChange={(e) => setDateBuy(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Expired</label>
              <input type="date" value={dateExpired} onChange={(e) => setDateExpired(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-md">
              {isPending ? "Broadcasting Updates..." : "Save Variant Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
