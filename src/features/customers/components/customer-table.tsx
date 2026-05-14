"use client";

import React, { useState } from "react";
import { Customer, deleteCustomerAction, appendCustomerProductAction, removeCustomerProductAction, extendCustomerProductAction, banCustomerProductAction, importCustomersCsvAction } from "../actions/customer-actions";
import { CustomerForm } from "./customer-form";
import { Trash2, Loader2, User, ShoppingBag, Plus, Calendar, Clock, Download, Upload, Ban, CalendarPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { getTierConfigForProduct } from "@/config/product-tiers";
import { Select, ListBox, ListBoxItem } from "@heroui/react";

interface CustomerTableProps {
  storeId: string;
  customers: Customer[];
  inventoryItems?: any[];
}

export function CustomerTable({ storeId, customers, inventoryItems = [] }: CustomerTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [appendingId, setAppendingId] = useState<string | null>(null);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [processingStream, setProcessingStream] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [streamActionTarget, setStreamActionTarget] = useState<{
    customerId: string;
    productIndex: number;
    productName: string;
    mode: "extend" | "ban";
  } | null>(null);

  // Appending form state values
  const [appendName, setAppendName] = useState("");
  const [appendVariant, setAppendVariant] = useState("1user");
  const [appendVariantOptions, setAppendVariantOptions] = useState<string[]>(["1user", "2user", "semi private", "private"]);
  const [appendDuration, setAppendDuration] = useState("30");
  const [appendDateStart, setAppendDateStart] = useState("");
  const [appendDateEnd, setAppendDateEnd] = useState("");

  const handleAppendNameChange = (val: string) => {
    setAppendName(val);
    const cfg = getTierConfigForProduct(val);
    setAppendVariant(cfg.defaultTier);
    setAppendVariantOptions(cfg.options);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteCustomerAction(storeId, id);
    setDeletingId(null);
  };

  const handleAppendSubmit = async (customerId: string) => {
    if (!appendName) return;
    setAppendingId(customerId);
    const now = new Date();
    const startIso = appendDateStart ? new Date(appendDateStart).toISOString() : now.toISOString();
    const durNum = parseInt(appendDuration, 10) || 30;
    const endIso = appendDateEnd 
      ? new Date(appendDateEnd).toISOString() 
      : new Date(new Date(startIso).getTime() + durNum * 86400000).toISOString();

    await appendCustomerProductAction(storeId, customerId, {
      name: appendName,
      variant: appendVariant,
      duration_days: durNum,
      bought_date: now.toISOString(),
      date_start: startIso,
      expire_date: endIso,
    });
    setAppendingId(null);
    setActiveFormId(null);
    // Reset inputs
    setAppendName("");
    setAppendVariant("1user");
    setAppendDuration("30");
    setAppendDateStart("");
    setAppendDateEnd("");
  };

  // Base Template Download Handlers
  const downloadCustomerTemplate = () => {
    const headers = "name;email;phone;product_name;product_variant;duration_days;bought_date\n";
    const example = "Jane Premium;jane@streaming.com;+15550192;Netflix Access;1user;30;2026-05-12\n";
    const blob = new Blob([headers + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "customer_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Dump JSON Array payload locally
  const exportDatabaseDump = () => {
    const payload = JSON.stringify({ store_id: storeId, timestamp: new Date().toISOString(), customers }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `store_${storeId.slice(0, 8)}_customers_dump.json`);
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

        const res = await importCustomersCsvAction(storeId, rows);
        if (res?.error) {
          toast.error(res.error);
        } else {
          toast.success(`Successfully imported ${res?.count || rows.length} customer records!`);
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

  const itemsPerPage = 10;
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 font-sans">
      {/* Top Controller Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-sm">
              {customers.length} Client Shards
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
            <span>Register Customer</span>
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
              <CustomerForm 
                storeId={storeId} 
                inventoryItems={inventoryItems} 
                onSuccess={() => setIsCreateModalOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Table Main Component */}
      <div className="bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-[#0b0f19]/80 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5 w-1/4 sm:w-3/12">Customer Profile</th>
                <th className="px-5 py-3.5">Ordered Asset Streams & Expiry Lifecycles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {paginatedCustomers.map((c) => {
                const isDeleting = deletingId === c.id;
                const isAppending = appendingId === c.id;
                const isFormActive = activeFormId === c.id;
                const products = Array.isArray(c.purchased_products) ? c.purchased_products : [];

                return (
                  <tr key={c.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 align-top transition-colors">
                    {/* Customer Profile Column */}
                    <td className="px-5 py-4.5 bg-slate-50/20 dark:bg-[#0b0f19]/30 border-r border-slate-50 dark:border-slate-800/50">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm truncate">{c.name}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={isDeleting}
                          className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-sm transition-colors disabled:opacity-50 shrink-0"
                          title="Erase Customer Container"
                        >
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="space-y-0.5 pl-9">
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">{c.email || "No Email"}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{c.phone || "No Phone"}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] rounded uppercase tracking-wider">
                          Orders: {products.length}
                        </span>
                      </div>
                    </td>

                    {/* Ordered Products Matrix */}
                    <td className="px-5 py-4 w-full">
                      {products.length > 0 ? (
                        <div className="space-y-2">
                          {products.map((p, idx) => {
                            // Check expiration status automatically
                            const isExpired = p.expire_date ? new Date(p.expire_date).getTime() < Date.now() : false;
                            const timestampStr = p.bought_date ? new Date(p.bought_date).toLocaleString() : "N/A";
                            const startStr = (p as any).date_start ? new Date((p as any).date_start).toLocaleDateString() : (p.bought_date ? new Date(p.bought_date).toLocaleDateString() : "N/A");
                            const expStr = p.expire_date ? new Date(p.expire_date).toLocaleDateString() : "N/A";

                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                                  isExpired
                                    ? "bg-red-50/40 dark:bg-red-950/20 border-red-100 dark:border-red-900/30"
                                    : "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/30"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <ShoppingBag className={`w-3.5 h-3.5 ${isExpired ? "text-red-400" : "text-emerald-500"}`} />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">{p.name}</span>
                                      <span className="px-1.5 py-0.2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-sm text-[9px] uppercase font-bold">
                                        {p.variant}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                                      <span className="flex items-center gap-0.5 font-bold text-indigo-900 dark:text-indigo-300">
                                        <Clock className="w-2.5 h-2.5" /> {p.duration_days} Days Cycle
                                      </span>
                                      <span>•</span>
                                      <span>Coverage: <strong className="text-slate-700 dark:text-slate-300">{startStr}</strong> → <strong className="text-slate-700 dark:text-slate-300">{expStr}</strong></span>
                                      <span>•</span>
                                      <span className="text-[9px] text-slate-400">Captured: {timestampStr}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:justify-end border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200/40 dark:border-slate-800/40">
                                  <div className="text-right flex sm:flex-col items-center sm:items-end gap-1 sm:gap-0">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                      Coverage Status
                                    </span>
                                    <span className={`text-[11px] font-black ${isExpired ? "text-red-600 line-through" : "text-emerald-700"}`}>
                                      {expStr}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-sm font-bold text-[9px] uppercase tracking-wider shrink-0 ${
                                      isExpired ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400" : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400"
                                    }`}
                                  >
                                    {isExpired ? "Expired" : "Active"}
                                  </span>

                                  {/* Custom Actions Array for this particular ordered asset segment */}
                                  <div className="flex items-center gap-1 border-l pl-2 ml-1 border-slate-200/50 dark:border-slate-800/50">
                                    <button
                                      type="button"
                                      onClick={() => setStreamActionTarget({ customerId: c.id, productIndex: idx, productName: p.name, mode: "extend" })}
                                      disabled={processingStream === `${c.id}-${idx}`}
                                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                                      title="Extend stream duration coverage"
                                    >
                                      <CalendarPlus className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStreamActionTarget({ customerId: c.id, productIndex: idx, productName: p.name, mode: "ban" })}
                                      disabled={processingStream === `${c.id}-${idx}`}
                                      className="p-1 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                                      title="Ban / terminate stream partition"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!confirm(`Are you absolutely sure you want to remove/kick ${p.name} from this profile? Connected inventory items will be unlinked and back available in stock.`)) return;
                                        setProcessingStream(`${c.id}-${idx}`);
                                        const res = await removeCustomerProductAction(storeId, c.id, idx);
                                        setProcessingStream(null);
                                        if (res?.error) toast.error(res.error);
                                        else toast.success(`Stream ${p.name} disassociated successfully`);
                                      }}
                                      disabled={processingStream === `${c.id}-${idx}`}
                                      className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                                      title="Remove/kick stream from profile"
                                    >
                                      {processingStream === `${c.id}-${idx}` ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" /> : <UserMinus className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs italic py-2">No product variants ordered yet.</p>
                      )}

                      {/* Inline Appender Trigger Section */}
                      <div className="mt-3 pt-2 border-t border-slate-100/80 dark:border-slate-800/80">
                        {!isFormActive ? (
                          <button
                            type="button"
                            onClick={() => setActiveFormId(c.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Append Streaming Product Order
                          </button>
                        ) : (
                          <div className="p-3 bg-slate-50 dark:bg-[#0b0f19] rounded-sm border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Assign Additional Product Variant</span>
                              <button
                                type="button"
                                onClick={() => setActiveFormId(null)}
                                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              <input
                                type="text"
                                placeholder="Product (e.g. Netflix)"
                                value={appendName}
                                onChange={(e) => handleAppendNameChange(e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-[11px] font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                              />
                              <div className="flex flex-col justify-end w-full">
                                <Select
                                  aria-label="Append Variant"
                                  placeholder="Variant"
                                  selectedKey={appendVariant || null}
                                  onSelectionChange={(key) => setAppendVariant(key ? key.toString() : "")}
                                  className="w-full"
                                >
                                  <Select.Trigger className="w-full h-[26px] min-h-[26px] py-0 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm shadow-none flex items-center justify-between px-2 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                                    <Select.Value />
                                  </Select.Trigger>
                                  <Select.Popover style={{ width: "var(--trigger-width)" }} className="bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl z-50 overflow-hidden">
                                    <ListBox className="p-1.5 outline-none space-y-0.5 max-h-60 overflow-y-auto">
                                      {appendVariantOptions.map((opt) => (
                                        <ListBoxItem key={opt} textValue={opt} className="px-2.5 py-1.5 text-xs rounded-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40 focus:bg-indigo-50 dark:focus:bg-indigo-950/40 cursor-pointer text-slate-700 dark:text-slate-300 font-medium select-none outline-none transition-colors">
                                          {opt}
                                        </ListBoxItem>
                                      ))}
                                    </ListBox>
                                  </Select.Popover>
                                </Select>
                              </div>
                              <select
                                value={appendDuration}
                                onChange={(e) => {
                                  setAppendDuration(e.target.value);
                                  if (appendDateStart) {
                                    const startObj = new Date(appendDateStart);
                                    if (!isNaN(startObj.getTime())) {
                                      const endObj = new Date(startObj.getTime() + Number(e.target.value) * 86400000);
                                      setAppendDateEnd(endObj.toISOString().split("T")[0]);
                                    }
                                  }
                                }}
                                className="px-2 py-1 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-[11px] font-bold text-indigo-900 dark:text-indigo-300 focus:outline-none"
                              >
                                <option value="1">1 Day</option>
                                <option value="7">7 Days</option>
                                <option value="28">28 Days</option>
                                <option value="30">30 Days</option>
                                <option value="90">90 Days</option>
                                <option value="365">365 Days</option>
                              </select>
                              <input
                                type="date"
                                title="Date Start"
                                value={appendDateStart}
                                onChange={(e) => {
                                  setAppendDateStart(e.target.value);
                                  const startObj = new Date(e.target.value);
                                  if (!isNaN(startObj.getTime())) {
                                    const endObj = new Date(startObj.getTime() + Number(appendDuration) * 86400000);
                                    setAppendDateEnd(endObj.toISOString().split("T")[0]);
                                  }
                                }}
                                className="px-2 py-1 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none"
                              />
                              <input
                                type="date"
                                title="Date End"
                                value={appendDateEnd}
                                onChange={(e) => setAppendDateEnd(e.target.value)}
                                className="px-2 py-1 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-[11px] font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAppendSubmit(c.id)}
                              disabled={isAppending || !appendName}
                              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-[10px] rounded-sm shadow-sm transition-all"
                            >
                              {isAppending ? "Summing Dates..." : "Confirm Mapped Order"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-5 py-12 text-center text-slate-400 italic">
                    Customer pool inactive. Provision buyers and streaming accesses using the core input above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 bg-slate-50/50 dark:bg-[#0b0f19]/50 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs transition-colors">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Showing <strong className="text-slate-700 dark:text-slate-200">{startIndex + 1}</strong> to{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {Math.min(startIndex + itemsPerPage, customers.length)}
              </strong>{" "}
              of <strong className="text-slate-700 dark:text-slate-200">{customers.length}</strong> entries
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 font-bold rounded-sm transition-all flex items-center justify-center ${
                    currentPage === page
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-white dark:bg-[#0d1322] border border-slate-200/60 dark:border-slate-800/80 rounded-sm shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
        <div>
          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Database CSV Template & Backup Engine
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Retrieve base payload strings perfectly matched to customer structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="h-[34px] px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
            {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{isImporting ? "Parsing..." : "Import CSV Records"}</span>
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
            onClick={downloadCustomerTemplate}
            className="h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Customer Template CSV
          </button>
          <button
            type="button"
            onClick={exportDatabaseDump}
            className="h-[34px] px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" /> Dump CRM Payload JSON
          </button>
        </div>
      </div>

      {/* Stream Modal Embed */}
      {streamActionTarget && (
        <StreamActionModal
          storeId={storeId}
          target={streamActionTarget}
          onClose={() => setStreamActionTarget(null)}
        />
      )}
    </div>
  );
}

function StreamActionModal({
  storeId,
  target,
  onClose,
}: {
  storeId: string;
  target: {
    customerId: string;
    productIndex: number;
    productName: string;
    mode: "extend" | "ban";
  };
  onClose: () => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("Violation of streaming parameters or account sharing breach");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);

    if (target.mode === "extend") {
      const added = parseInt(days, 10);
      if (isNaN(added) || added <= 0) {
        toast.error("Please provide a valid integer duration");
        setIsPending(false);
        return;
      }
      const res = await extendCustomerProductAction(storeId, target.customerId, target.productIndex, added);
      setIsPending(false);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Stream segment extended by +${added} days successfully`);
        onClose();
      }
    } else {
      const res = await banCustomerProductAction(storeId, target.customerId, target.productIndex, reason);
      setIsPending(false);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Stream segment successfully terminated and flagged as Banned");
        onClose();
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
      <div className="w-full max-w-md bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm shadow-2xl overflow-hidden flex flex-col">
        <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
          target.mode === "extend" ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/40" : "bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-900/40"
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${
            target.mode === "extend" ? "text-indigo-800 dark:text-indigo-300" : "text-red-800 dark:text-red-300"
          }`}>
            {target.mode === "extend" ? "Extend Coverage Lifecycle" : "Ban / Terminate Asset Stream"}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Stream Asset</label>
            <input type="text" readOnly value={target.productName} className="w-full h-[32px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none" />
          </div>

          {target.mode === "extend" ? (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Additional Duration (Days)</label>
              <input type="number" required autoFocus min="1" value={days} onChange={(e) => setDays(e.target.value)} className="w-full h-[34px] px-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-indigo-500 transition-colors" />
              <div className="flex gap-1.5 mt-2">
                {["7", "14", "30", "90"].map((d) => (
                  <button key={d} type="button" onClick={() => setDays(d)} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-sm transition-colors">
                    +{d}d
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Termination / Ban Reason</label>
              <textarea required autoFocus rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Terms of Service breach" className="w-full p-2.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:border-red-500 transition-colors" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-sm">Cancel</button>
            <button type="submit" disabled={isPending} className={`px-4 py-1.5 text-white text-xs font-bold rounded-sm shadow-sm disabled:opacity-50 ${
              target.mode === "extend" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"
            }`}>
              {isPending ? "Broadcasting..." : target.mode === "extend" ? "Confirm Extension" : "Enforce Ban"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
