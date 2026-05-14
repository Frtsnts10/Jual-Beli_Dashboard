"use client";

import React, { useState, useMemo } from "react";
import { Save, AlertOctagon, Image as ImageIcon, Globe, Upload } from "lucide-react";
import { updateStoreSettingsAction, deleteStoreAction } from "../actions/settings-actions";

interface StoreSettingsFormProps {
  storeId: string;
  initialName: string;
  initialLogo?: string;
  initialCurrency?: string;
}

export function StoreSettingsForm({ storeId, initialName, initialLogo = "", initialCurrency = "USD" }: StoreSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client preview and storage states
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const [currency, setCurrency] = useState(initialCurrency);

  // Client-side HTML5 auto-compression image resizing utility matching requirements
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDimension = 160;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress cleanly into base64 payload string
        const compressedBase64 = canvas.toDataURL("image/webp", 0.85);
        setLogoPreview(compressedBase64);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Append auto-compressed preview payload natively
    formData.set("logo_url", logoPreview);
    formData.set("currency", currency);

    const res = await updateStoreSettingsAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
  }

  async function handleDelete() {
    if (!confirm("CRITICAL WARNING: This action drops the tenant partition and cascades deletion across all bounded inventory, customer vectors, and ticket rows. Confirm drop?")) {
      return;
    }
    setIsDeleting(true);
    await deleteStoreAction(storeId);
  }

  // Extract supported currency keys and native formatting descriptors using internal JS libraries
  const currencies = useMemo(() => {
    const codes = typeof Intl !== "undefined" && Intl.supportedValuesOf 
      ? Intl.supportedValuesOf("currency") 
      : ["USD", "EUR", "GBP", "JPY", "IDR", "AUD", "CAD", "CNY", "SGD"];
      
    const names = typeof Intl !== "undefined" && Intl.DisplayNames 
      ? new Intl.DisplayNames(["en"], { type: "currency" }) 
      : null;

    return codes.map((code) => {
      let symbol = code;
      try {
        const parts = new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" }).formatToParts(0);
        const p = parts.find((pt) => pt.type === "currency");
        if (p) symbol = p.value;
      } catch (e) {}

      let name = code;
      try {
        if (names) {
          name = names.of(code) || code;
        }
      } catch (e) {}

      return { code, symbol, name };
    });
  }, []);

  return (
    <div className="space-y-6 font-sans">
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Tenant Properties Matrix</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify public alias signatures, high-fidelity auto-compressed logos, and base currency descriptors.
          </p>
        </div>

        {success && (
          <div className="p-2.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl font-medium">
            Workspace configuration matrix synchronised to persistent Supabase memory successfully.
          </div>
        )}

        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Store Name input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Workspace Designation
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={initialName}
              className="w-full h-9 px-3.5 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              placeholder="e.g. Netflix Stream Outlet"
            />
          </div>

          {/* Currency selection dropdown */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-500" /> Global Preferences Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-9 px-3.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto-Compressed File Importer */}
        <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Brand Logo Matrix (Auto-Resized Client Container)
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-300" />
              )}
            </div>
            <div className="space-y-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-sm cursor-pointer transition-colors shadow-sm">
                <Upload className="w-3 h-3 text-slate-500" /> Choose Graphic
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-[10px] text-slate-400">
                Uploaded images compress dynamically via local canvas buffers to optimal lightweight WEBP payloads.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-sm transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            {isPending ? "Applying Shard Mutations..." : "Save Properties Matrix"}
          </button>
        </div>
      </form>

      {/* Danger matrix panel */}
      <div className="p-6 bg-red-50/50 dark:bg-red-950/20 rounded-sm border border-red-100 dark:border-red-900/40 space-y-3 transition-colors">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" />
          <h3 className="text-xs font-bold text-red-950 dark:text-red-400 uppercase tracking-wider">
            Danger Deletion Area
          </h3>
        </div>
        <p className="text-xs text-red-800/80 dark:text-red-300/80 leading-relaxed max-w-2xl">
          Instantly drops the active shard pointer and deletes memory footprints irrevocably. Data exports must be captured prior to triggering execution.
        </p>
        <div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-sm transition-all"
          >
            {isDeleting ? "Dropping Shard..." : "Purge Workspace Instance"}
          </button>
        </div>
      </div>
    </div>
  );
}
