"use client";

import React, { useState } from "react";
import { Customer, updateCustomerAction, deleteCustomerAction, appendCustomerProductAction, removeCustomerProductAction, extendCustomerProductAction, banCustomerProductAction, importCustomersCsvAction, updateCustomerProductDeviceAction } from "../actions/customer-actions";
import { CustomerForm } from "./customer-form";
import { Trash2, Loader2, User, ShoppingBag, Plus, Calendar, Clock, Download, Upload, Ban, CalendarPlus, UserMinus, Edit2, RefreshCw, MonitorSmartphone, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { getTierConfigForProduct } from "@/config/product-tiers";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem, Button, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { PhoneInput } from "@/components/ui/phone-input";
import { EditCustomerModal } from "./edit-customer-modal";
import { StreamActionModal } from "./stream-action-modal";
import { useRouter } from "next/navigation";

interface CustomerTableProps {
  storeId: string;
  customers: Customer[];
  inventoryItems?: any[];
}

export function CustomerTable({ storeId, customers, inventoryItems = [] }: CustomerTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [appendingId, setAppendingId] = useState<string | null>(null);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [processingStream, setProcessingStream] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingDeviceFor, setEditingDeviceFor] = useState<string | null>(null);
  const [deviceInputValue, setDeviceInputValue] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handlePageChange = (newPage: number) => {
    setIsTransitioning(true);
    setCurrentPage(newPage);
    setTimeout(() => setIsTransitioning(false), 150);
  };
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImporing, setIsImporing] = useState(false);
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

  
  const handleDeviceUpdate = async (customerId: string, idx: number) => {
    setProcessingStream(`device-${customerId}-${idx}`);
    const res = await updateCustomerProductDeviceAction(storeId, customerId, idx, deviceInputValue);
    setProcessingStream(null);
    if (res?.error) toast.error(res.error);
    else toast.success("Device logged securely");
    setEditingDeviceFor(null);
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

  // Base Templat Download Handlers
  // Export Handlers
  const downloadCustomerTemplat = () => {
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

  const exportCustomersCsv = () => {
    const headers = "name;email;phone;orders_count\n";
    const rows = customers.map(c => 
      `${c.name};${c.email || ""};${c.phone || ""};${Array.isArray(c.purchased_products) ? c.purchased_products.length : 0}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_export_${storeId.slice(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    setIsImporing(true);
    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv')) {
        const text = await file.text();
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
        if (res?.error) toast.error(res.error);
        else toast.success(`Successfully imported ${res?.count || rows.length} customer records from CSV!`);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "array" });
        const allRows: any[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const upSheet = sheetName.toUpperCase().replace(/\s/g, "");

          // Determine product name from sheet name
          let productName = sheetName;
          if (upSheet.includes("NET") || upSheet.includes("SEMPRIV")) productName = "Netflix";
          else if (upSheet.includes("CANVA")) productName = "Canva";
          else if (upSheet.includes("CAPCUT")) productName = "Capcut";

          // ─── CAPCUT sheet: has explicit lowercase headers (email, password, user) ───
          if (upSheet.includes("CAPCUT")) {
            const rawJson = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" }) as any[];
            rawJson.forEach((row) => {
              const keys = Object.keys(row).map(k => k.trim().toLowerCase());
              const getVal = (target: string) => {
                const k = Object.keys(row).find(k => k.trim().toLowerCase() === target);
                return k ? row[k]?.toString().trim() : "";
              };
              const phone = getVal("user");
              const vaultEmail = getVal("email");
              const vaultPass = getVal("password");
              if (!phone || phone.includes("@")) return; // skip header-like or empty rows

              const durasiStr = getVal("durasi").toUpperCase();
              let durasiNum = 30;
              if (durasiStr.includes("3")) durasiNum = 90;
              if (durasiStr.includes("2")) durasiNum = 60;
              if (durasiStr.includes("6")) durasiNum = 180;
              if (durasiStr.includes("12")) durasiNum = 365;

              let variant = getVal("jenis").toLowerCase();
              if (variant === "1u") variant = "1user";
              else if (variant === "2u") variant = "2user";
              else if (variant === "priv") variant = "private";
              if (!variant) variant = "1user";

              const dateStr = getVal("langgal order") || getVal("tanggal order");
              let dateObj = new Date();
              if (dateStr) {
                const d = new Date(dateStr + " " + new Date().getFullYear());
                if (!isNaN(d.getTime())) dateObj = d;
              }
              allRows.push({
                customer_name: "Unnamed Customer", phone,
                vault_email: vaultEmail, vault_password: vaultPass,
                profile_pin: "", device: "",
                product_name: productName, product_variant: variant,
                duration_days: durasiNum, bought_date: dateObj.toISOString(),
              });
            });
            return; // done with this sheet
          }

          // ─── CANVAAA sheet: USERNAME = customer email, no vault ───
          if (upSheet.includes("CANVA")) {
            const rawJson = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" }) as any[];
            rawJson.forEach((row) => {
              const usernameKey = Object.keys(row).find(k => k.trim().toUpperCase() === "USERNAME");
              const usernameStr = usernameKey ? row[usernameKey]?.toString().trim() : "";
              if (!usernameStr || usernameStr.toUpperCase() === "USERNAME") return;

              const durasiKey = Object.keys(row).find(k => k.trim().toUpperCase() === "DURASI");
              const jenisKey = Object.keys(row).find(k => k.trim().toUpperCase() === "JENIS");
              const tanggalKey = Object.keys(row).find(k => k.trim().toUpperCase().includes("TANGGAL ORDER"));

              const durasiStr = durasiKey ? row[durasiKey]?.toString().toUpperCase() : "3 BULAN";
              let durasiNum = 90;
              if (durasiStr.includes("1 ")) durasiNum = 30;
              if (durasiStr.includes("6")) durasiNum = 180;
              if (durasiStr.includes("12")) durasiNum = 365;

              let variant = jenisKey ? row[jenisKey]?.toString().toLowerCase().trim() : "member";
              if (variant === "member") variant = "member";

              const dateStr = tanggalKey ? row[tanggalKey]?.toString() : "";
              let dateObj = new Date();
              if (dateStr) {
                const d = new Date(dateStr + " " + new Date().getFullYear());
                if (!isNaN(d.getTime())) dateObj = d;
              }

              // For Canva, USERNAME is the customer's own email
              allRows.push({
                customer_name: "Unnamed Customer",
                phone: usernameStr.includes("@") ? "" : usernameStr,
                customer_email: usernameStr.includes("@") ? usernameStr : "",
                vault_email: "", vault_password: "",
                profile_pin: "", device: "",
                product_name: productName, product_variant: variant,
                duration_days: durasiNum, bought_date: dateObj.toISOString(),
              });
            });
            return; // done with this sheet
          }

          // ─── NET 2U, NET 1U, SEMPRIV: Netflix sheets with PASS rows ───
          const rawJson = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" }) as any[];
          let currentPassword = "";
          let currentEmail = "";

          rawJson.forEach((row) => {
            const allKeys = Object.keys(row);
            const getKey = (target: string) => allKeys.find(k => k.trim().toUpperCase() === target.toUpperCase());
            const getVal = (target: string) => {
              const k = getKey(target);
              return k ? row[k]?.toString().trim() : "";
            };

            const firstColStr = Object.values(row)[0]?.toString().trim() || "";
            const secondColStr = Object.values(row)[1]?.toString().trim() || "";

            // Detect PASS row (first column has "PASS :" text OR any column has it)
            const anyPassCol = allKeys.find(k => row[k]?.toString().toUpperCase().includes("PASS :"));
            if (anyPassCol) {
              currentPassword = row[anyPassCol].toString().split(":")[1]?.trim() || "";
              return;
            }

            // Detect vertically merged email (col A or B has @)
            if (firstColStr.includes("@")) { currentEmail = firstColStr; }
            if (secondColStr && !secondColStr.includes("@") && firstColStr.includes("@")) {
              // col B is likely the password for SEMPRIV format
              if (secondColStr && !currentPassword) currentPassword = secondColStr;
            }

            // Detect explicit EMAIL column (NET 2U format)
            const emailVal = getVal("EMAIL");
            if (emailVal && emailVal.includes("@")) currentEmail = emailVal;

            // Detect explicit PASS column
            const passVal = getVal("PASS");
            if (passVal) currentPassword = passVal;

            // Get customer phone from USERNAME column (col B for SEMPRIV, col A for NET)
            let phone = getVal("USERNAME");
            
            // For SEMPRIV, USERNAME is actually in col C (index 2) since A=email, B=pass
            if (!phone && !firstColStr.includes("@")) {
              // might be flat format with B=PASS header label
              const colVals = Object.values(row).map((v: any) => v?.toString().trim());
              phone = colVals.find((v: string) => v && v.match(/^08\d{8,11}$/)) || "";
            }

            if (!phone || phone.trim() === "" || !phone.match(/^08/)) return;

            // Get profile name (col D = PROFILE column, the Netflix slot name like mama/papa/kiwi)
            const profileName = getVal("PROFILE") || "";

            // PIN: look for explicit PIN column first, then scan __EMPTY cols for 4-digit number
            let foundPin = getVal("PIN");
            if (!foundPin) {
              for (const k of allKeys.filter(k => k.startsWith("__EMPTY"))) {
                const v = row[k]?.toString().trim();
                if (v && v.match(/^\d{4}$/)) { foundPin = v; break; }
              }
            }

            const durasiStr = getVal("DURASI").toUpperCase() || "1 BULAN";
            let durasiNum = 30;
            if (durasiStr.startsWith("2") || durasiStr.includes("2 BULAN")) durasiNum = 60;
            else if (durasiStr.startsWith("3") || durasiStr.includes("3 BULAN")) durasiNum = 90;
            else if (durasiStr.includes("6")) durasiNum = 180;
            else if (durasiStr.includes("12")) durasiNum = 365;

            let variant = getVal("JENIS").toLowerCase();
            if (variant === "1u") variant = "1user";
            else if (variant === "2u") variant = "2user";
            if (!variant) variant = upSheet.includes("NET2") || upSheet.includes("2U") ? "2user" : "1user";

            const dateStr = getVal("TANGGAL ORDER");
            let dateObj = new Date();
            if (dateStr) {
              const d = new Date(dateStr + " " + new Date().getFullYear());
              if (!isNaN(d.getTime())) dateObj = d;
            }

            allRows.push({
              customer_name: "Unnamed Customer", phone,
              profile_name: profileName,
              vault_email: currentEmail, vault_password: currentPassword,
              profile_pin: foundPin, device: getVal("JENIS DEVICE"),
              product_name: productName, product_variant: variant,
              duration_days: durasiNum, bought_date: dateObj.toISOString(),
            });
          });
        });

        // @ts-ignore
        const { importComplexExcelDataAction } = await import("../actions/customer-actions");
        const res = await importComplexExcelDataAction(storeId, allRows);
        if (res?.error) toast.error(res.error);
        else toast.success(`Successfully imported ${res?.count || allRows.length} records! Customers and Inventory created.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed hingga process file");
    } finally {
      setIsImporing(false);
      e.target.value = "";
    }
  };

  const itemsPerPage = 5;
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = customers.slice(startIndex, startIndex + itemsPerPage);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Vektor CRM Pelanggan</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ikat profil pembelian eksternal dan periksa jumlah transaksi dengan aman.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-[38px] flex items-center justify-center text-xs font-bold px-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100/40 dark:border-indigo-900/40">
            {customers.length} Toko Klien
          </span>
          <Button 
            size="sm" 
            className="h-[38px] bg-[#e2e2f6] hover:bg-[#d0d0ed] text-[#065bce] font-bold tracking-wide text-xs px-4"
            onPress={handleSync}
            isDisabled={isSyncing}
            startContent={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />}
          >
            SYNC
          </Button>
          <Button
            onPress={() => setIsCreateModalOpen(true)}
            color="primary"
            radius="lg"
            className="h-[38px] px-5 text-xs font-bold shadow-md"
            startContent={<Plus className="w-4 h-4" />}
          >
            Daftarkan Pelanggan
          </Button>
        </div>
      </div>

      {/* Dynamic Creation Modal Embed */}
      <Modal isOpen={isCreateModalOpen} onOpenChange={(open) => setIsCreateModalOpen(open)} size="4xl" scrollBehavior="inside" classNames={{
        base: "bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-2xl",
        body: "p-0"
      }}>
        <ModalContent>
          <ModalBody>
            <CustomerForm 
              storeId={storeId} 
              inventoryItems={inventoryItems} 
              onSuccess={() => setIsCreateModalOpen(false)} 
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Table Main Component */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Matriks Database Pelanggan
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Kelola kepemilikan profil secara langsung dan segmen aset streaming yang ditautkan.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onPress={exportCustomersCsv}
              variant="bordered"
              radius="lg"
              className="h-[34px] text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              startContent={<Download className="w-3.5 h-3.5" />}
            >
              Ekspor CSV
            </Button>
            <Button
              onPress={exportDatabaseDump}
              variant="flat"
              radius="lg"
              className="h-[34px] text-xs font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50"
              startContent={<Plus className="w-3.5 h-3.5" />}
            >
              Dump JSON
            </Button>
            <label className="h-[34px] flex items-center justify-center px-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold transition-all gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Impor
              <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} disabled={isImporing} className="hidden" />
            </label>
            <Button
              onPress={downloadCustomerTemplat}
              variant="flat"
              radius="lg"
              className="h-[34px] text-xs font-bold bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
              startContent={<Download className="w-3.5 h-3.5" />}
            >
              Templat
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-[#0b0f19]/80 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5 min-w-[220px]">Customer Profile</th>
                <th className="px-5 py-3.5 min-w-[340px]">Ordered Asset Streams & Expiry Lifecycles</th>
              </tr>
            </thead>
            <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 text-xs transition-all duration-150 ${isTransitioning ? "opacity-30 blur-[1px] scale-[0.99]" : ""}`}>
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
                        <Button
                          isIconOnly
                          variant="light"
                          onPress={() => setEditingCustomer(c)}
                          className="w-7 h-7 min-w-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          title="Edit Customer Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          onPress={() => handleDelete(c.id)}
                          isDisabled={isDeleting}
                          isLoading={isDeleting}
                          className="w-7 h-7 min-w-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Erase Customer Container"
                        >
                          {!isDeleting && <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                      <div className="space-y-0.5 pl-9">
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">{c.email || "Tidak Ada Email"}</p>
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
                                className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
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
                                      <span className="px-1.5 py-0.2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[9px] uppercase font-bold">
                                        {p.variant}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                                      <span className="flex items-center gap-0.5 font-bold text-indigo-900 dark:text-indigo-300">
                                        <Clock className="w-2.5 h-2.5" /> {p.duration_days} Days Cycle
                                      </span>
                                      <span>•</span>
                                      <span>Cakupan: <strong className="text-slate-700 dark:text-slate-300">{startStr}</strong> → <strong className="text-slate-700 dark:text-slate-300">{expStr}</strong></span>
                                      <span>•</span>
                                      <span className="text-[9px] text-slate-400">Ditangkap: {timestampStr}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 sm:justify-end border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200/40 dark:border-slate-800/40">
                                  <div className="text-right flex sm:flex-col items-center sm:items-end gap-1 sm:gap-0">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                      Status Cakupan
                                    </span>
                                    <span className={`text-[11px] font-black ${isExpired ? "text-red-600 line-through" : "text-emerald-700"}`}>
                                      {expStr}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-lg font-bold text-[9px] uppercase tracking-wider shrink-0 ${
                                      isExpired ? "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400" : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400"
                                    }`}
                                  >
                                    {isExpired ? "Kedaluwarsa" : "Aktif"}
                                  </span>

                                  {/* Custom Actions Array for this particular ordered asset segment */}
                                  <div className="flex items-center gap-1 border-l pl-2 ml-1 border-slate-200/50 dark:border-slate-800/50">
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      onPress={() => setStreamActionTarget({ customerId: c.id, productIndex: idx, productName: p.name, mode: "extend" })}
                                      isDisabled={processingStream === `${c.id}-${idx}`}
                                      className="w-7 h-7 min-w-0 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Extend stream duration coverage"
                                    >
                                      <CalendarPlus className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      onPress={() => setStreamActionTarget({ customerId: c.id, productIndex: idx, productName: p.name, mode: "ban" })}
                                      isDisabled={processingStream === `${c.id}-${idx}`}
                                      className="w-7 h-7 min-w-0 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Ban / terminate stream partition"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      onPress={async () => {
                                        if (!confirm(`Are you absolutely sure you want hingga remove/kick ${p.name} from this profile? Connected inventory items will be unlinked and back available in stock.`)) return;
                                        setProcessingStream(`${c.id}-${idx}`);
                                        const res = await removeCustomerProductAction(storeId, c.id, idx);
                                        setProcessingStream(null);
                                        if (res?.error) toast.error(res.error);
                                        else toast.success(`Stream ${p.name} disassociated successfully`);
                                      }}
                                      isDisabled={processingStream === `${c.id}-${idx}`}
                                      isLoading={processingStream === `${c.id}-${idx}`}
                                      className="w-7 h-7 min-w-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Remove/kick stream from profile"
                                    >
                                      {processingStream !== `${c.id}-${idx}` && <UserMinus className="w-3.5 h-3.5" />}
                                    </Button>
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
                          <Button
                            onPress={() => setActiveFormId(c.id)}
                            variant="light"
                            radius="lg"
                            className="h-[28px] text-[11px] font-bold text-indigo-600 dark:text-indigo-400"
                            startContent={<Plus className="w-3.5 h-3.5" />}
                          >
                            Tambahkan Pesanan Produk Streaming
                          </Button>
                        ) : (
                          <div className="p-3 bg-slate-50 dark:bg-[#0b0f19] rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Assign Additional Product Variant</span>
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={() => setActiveFormId(null)}
                                className="text-[10px] min-w-0 h-6 text-slate-400 hover:text-slate-600 font-bold"
                              >
                                Cancel
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                              <Input
                                type="text"
                                label="Product"
                                labelPlacement="outside"
                                placeholder="e.g. Netflix"
                                value={appendName}
                                onValueChange={handleAppendNameChange}
                                variant="faded"
                                radius="lg"
                                classNames={{
                                  inputWrapper: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[26px] min-h-[26px]",
                                  label: "text-[9px] font-bold text-slate-400 uppercase",
                                  input: "text-[11px] font-bold text-slate-800 dark:text-slate-200"
                                }}
                              />
                              <div className="flex flex-col w-full">
                                <Select
                                  aria-label="Append Variant"
                                  label="Variant"
                                  labelPlacement="outside"
                                  selectedKeys={[appendVariant]}
                                  onChange={(e) => setAppendVariant(e.target.value)}
                                  variant="faded"
                                  radius="lg"
                                  classNames={{
                                    trigger: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[26px] min-h-[26px]",
                                    label: "text-[9px] font-bold text-slate-400 uppercase",
                                    value: "text-[11px] font-medium text-slate-800 dark:text-slate-200"
                                  }}
                                >
                                  {appendVariantOptions.map((opt) => (
                                    <SelectItem key={opt}>{opt}</SelectItem>
                                  ))}
                                </Select>
                              </div>
                              <Select
                                label="Duration"
                                labelPlacement="outside"
                                selectedKeys={[appendDuration]}
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
                                variant="faded"
                                radius="lg"
                                classNames={{
                                  trigger: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[26px] min-h-[26px]",
                                  label: "text-[9px] font-bold text-slate-400 uppercase",
                                  value: "text-[11px] font-bold text-indigo-900 dark:text-indigo-300"
                                }}
                              >
                                <SelectItem key="1">1 Day</SelectItem>
                                <SelectItem key="7">7 Days</SelectItem>
                                <SelectItem key="28">28 Days</SelectItem>
                                <SelectItem key="30">30 Days</SelectItem>
                                <SelectItem key="90">90 Days</SelectItem>
                                <SelectItem key="365">365 Days</SelectItem>
                              </Select>
                              <DatePicker
                                name="date_start"
                                label="Date Start"
                                labelPlacement="outside"
                                value={appendDateStart ? (parseDate(appendDateStart) as any) : null}
                                onChange={(val) => {
                                  const strVal = val ? val.toString() : "";
                                  setAppendDateStart(strVal);
                                  if (strVal) {
                                    const startObj = new Date(strVal);
                                    if (!isNaN(startObj.getTime())) {
                                      const endObj = new Date(startObj.getTime() + Number(appendDuration) * 86400000);
                                      setAppendDateEnd(endObj.toISOString().split("T")[0]);
                                    }
                                  }
                                }}
                                variant="faded"
                                radius="lg"
                                classNames={{
                                  inputWrapper: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[26px] min-h-[26px]",
                                  label: "text-[9px] font-bold text-slate-400 uppercase",
                                  input: "text-[11px] text-slate-800 dark:text-slate-200"
                                }}
                              />
                              <DatePicker
                                name="date_end"
                                label="Date End"
                                labelPlacement="outside"
                                value={appendDateEnd ? (parseDate(appendDateEnd) as any) : null}
                                onChange={(val) => setAppendDateEnd(val ? val.toString() : "")}
                                variant="faded"
                                radius="lg"
                                classNames={{
                                  inputWrapper: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[26px] min-h-[26px]",
                                  label: "text-[9px] font-bold text-slate-400 uppercase",
                                  input: "text-[11px] font-bold text-emerald-700 dark:text-emerald-400"
                                }}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onPress={() => handleAppendSubmit(c.id)}
                                isDisabled={isAppending || !appendName}
                                isLoading={isAppending}
                                color="primary"
                                radius="lg"
                                className="h-[26px] px-3 font-bold text-[10px] shadow-sm"
                              >
                                {isAppending ? "Summing Dates..." : "Confirm Mapped Order"}
                              </Button>
                            </div>
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
              Menampilkan <strong className="text-slate-700 dark:text-slate-200">{startIndex + 1}</strong> to{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {Math.min(startIndex + itemsPerPage, customers.length)}
              </strong>{" "}
              dari <strong className="text-slate-700 dark:text-slate-200">{customers.length}</strong> entri
            </span>
            <div className="flex items-center gap-1">
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

      {/* Stream Modal Embed */}
      {streamActionTarget && (
        <StreamActionModal
          storeId={storeId}
          target={streamActionTarget}
          onClose={() => setStreamActionTarget(null)}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          storeId={storeId}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}
    </div>
  );
}


