"use client";

import React, { useState } from "react";
import { PlusCircle, Users } from "lucide-react";
import { createInventoryItemAction } from "../actions/inventory-actions";
import { getTierConfigForProduct } from "@/config/product-tiers";

interface InventoryFormProps {
  storeId: string;
  currency?: string;
  onSuccess?: () => void;
}

export function InventoryForm({ storeId, currency = "IDR", onSuccess }: InventoryFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIDR = currency.toUpperCase() === "IDR";
  const isNonDecimal = ["IDR", "JPY", "KRW", "VND"].includes(currency.toUpperCase());
  const basePlaceholder = isIDR ? "150.000,00" : isNonDecimal ? "1500" : "12.00";
  const sellingPlaceholder = isIDR ? "199.000,00" : isNonDecimal ? "1999" : "19.99";

  const [basePriceStr, setBasePriceStr] = useState("");
  const [sellingPriceStr, setSellingPriceStr] = useState("");

  const [productName, setProductName] = useState("");
  const [tierVariant, setTierVariant] = useState("");
  const [tierOptions, setTierOptions] = useState<string[]>(["1user", "2user", "semi private", "private"]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setProductName(val);
    const cfg = getTierConfigForProduct(val);
    setTierVariant(cfg.defaultTier);
    setTierOptions(cfg.options);
  };

  // Clean formatted input strings into native float metrics
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

  // Gracefully restructure layout string formatting on field blur
  const handlePriceBlur = (setter: React.Dispatch<React.SetStateAction<string>>, currentStr: string) => {
    if (!currentStr) return;
    const val = parsePriceFloat(currentStr);
    if (val === 0) return;

    if (isIDR) {
      const formatted = new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
      setter(formatted);
    } else {
      setter(val.toString());
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await createInventoryItemAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      form.reset();
      setBasePriceStr("");
      setSellingPriceStr("");
      setProductName("");
      setTierVariant("");
      onSuccess?.();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4 font-sans transition-colors"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-indigo-600" />
          Add Digital Resale Account Variant
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Map specific sub-accounts, streaming tiers, credentials, and auto-allocated family pool partitions.
        </p>
      </div>

      {error && (
        <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Row 1: Asset Core */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Product Name</label>
          <input
            name="name"
            type="text"
            required
            value={productName}
            onChange={handleNameChange}
            placeholder="e.g. YouTube Premium Family"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex flex-col justify-end w-full">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profile Tier Variant</label>
          <select
            name="profile_tier"
            value={tierVariant}
            onChange={(e) => setTierVariant(e.target.value)}
            className="w-full h-[34px] px-2.5 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          >
            {tierOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profile Designation</label>
          <input
            name="profile_name"
            type="text"
            placeholder="e.g. Member Slot Alpha"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Row 2: Grouping & Pool Configuration */}
      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
          <Users className="w-3 h-3 text-indigo-500" /> Family Pool Group Designation (Optional)
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            name="group_name"
            type="text"
            placeholder="Leave blank for auto-assignment based on name/duration parameters (Max 5/6 members)"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          💡 For family assets (Google, YouTube, Canva), omission triggers smart bucket filling matching active unconstrained groups automatically.
        </p>
      </div>

      {/* Row 3: Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Account Email</label>
          <input
            name="email"
            type="email"
            placeholder="account@streaming.com"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password</label>
          <input
            name="password"
            type="text"
            placeholder="••••••••"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Profile PIN</label>
          <input
            name="pin"
            type="text"
            placeholder="e.g. 1234"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-mono text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Row 4: Pricing & Quota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Base Price ({currency})</label>
          <input
            type="text"
            inputMode="decimal"
            value={basePriceStr}
            onChange={(e) => setBasePriceStr(e.target.value)}
            onBlur={() => handlePriceBlur(setBasePriceStr, basePriceStr)}
            placeholder={basePlaceholder}
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          <input type="hidden" name="base_price" value={parsePriceFloat(basePriceStr)} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Selling Price ({currency})</label>
          <input
            type="text"
            inputMode="decimal"
            required
            value={sellingPriceStr}
            onChange={(e) => setSellingPriceStr(e.target.value)}
            onBlur={() => handlePriceBlur(setSellingPriceStr, sellingPriceStr)}
            placeholder={sellingPlaceholder}
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-indigo-900 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/20 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
          <input type="hidden" name="selling_price" value={parsePriceFloat(sellingPriceStr)} />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Available Profiles (Stock)</label>
          <input
            name="stock"
            type="number"
            defaultValue="1"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Row 5: Lifecycles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Buy</label>
          <input
            name="date_buy"
            type="date"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date Expired</label>
          <input
            name="date_expired"
            type="date"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-md transition-all"
        >
          {isPending ? "Mapping Variant Payload..." : "Add Digital Inventory Row"}
        </button>
      </div>
    </form>
  );
}
