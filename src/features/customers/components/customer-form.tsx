"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, ShoppingBag, Clock, ChevronDown } from "lucide-react";
import { createCustomerAction } from "../actions/customer-actions";
import { getTierConfigForProduct } from "@/config/product-tiers";
import { COUNTRY_CODES } from "@/config/countries";

interface CustomerFormProps {
  storeId: string;
  inventoryItems?: any[];
  onSuccess?: () => void;
}

export function CustomerForm({ storeId, inventoryItems = [], onSuccess }: CustomerFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive distinct active inventory product vectors
  const distinctProducts = Array.from(
    new Set(inventoryItems.map((item) => item.name).filter(Boolean))
  );

  // Initialize interactive sub-form state logic
  const initProd = distinctProducts[0] || "";
  const initCfg = getTierConfigForProduct(initProd);
  const [selectedProduct, setSelectedProduct] = useState(initProd);
  const [productVariant, setProductVariant] = useState(initCfg.defaultTier);
  const [tierOptions, setTierOptions] = useState<string[]>(initCfg.options);

  const handleProductSelection = (val: string) => {
    setSelectedProduct(val);
    const cfg = getTierConfigForProduct(val);
    setProductVariant(cfg.defaultTier);
    setTierOptions(cfg.options);
  };

  const [durationDays, setDurationDays] = useState<number>(30);
  
  // Format current date as YYYY-MM-DD for standard native HTML date controls
  const todayStr = new Date().toISOString().split("T")[0];
  const [dateStart, setDateStart] = useState<string>(todayStr);
  const [dateEnd, setDateEnd] = useState<string>("");

  // International Country Calling Code Library State
  const [countryCode, setCountryCode] = useState("+62");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isOpenCountry, setIsOpenCountry] = useState(false);

  // Retrieve current active descriptor
  const selectedCountryObj = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[2];

  // Automatically compute target expiration timeline boundary based on Start Date + Duration Cycle
  useEffect(() => {
    if (dateStart) {
      const startObj = new Date(dateStart);
      if (!isNaN(startObj.getTime())) {
        const targetEndObj = new Date(startObj.getTime() + durationDays * 24 * 60 * 60 * 1000);
        setDateEnd(targetEndObj.toISOString().split("T")[0]);
      }
    }
  }, [dateStart, durationDays]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await createCustomerAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      form.reset();
      // Reset local stream constraints
      setDateStart(new Date().toISOString().split("T")[0]);
      setDurationDays(30);
      setPhoneNumber("");
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
          <UserPlus className="w-4 h-4 text-indigo-600" />
          Register Customer & Ordered Variants
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Provision buyer profile profiles along with embedded product streams and automated auto-sum duration mapping.
        </p>
      </div>

      {error && (
        <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
          {error}
        </div>
      )}

      {/* Primary Bio Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Full Name</label>
          <input
            name="name"
            type="text"
            required
            placeholder="e.g. Alex Rivera"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Connection</label>
          <input
            name="email"
            type="email"
            placeholder="alex@domain.com"
            className="w-full h-[34px] px-3 py-1.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
          <div className="flex items-center w-full h-[34px] bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-colors relative">
            {/* Custom Popover Trigger */}
            <button
              type="button"
              onClick={() => setIsOpenCountry(!isOpenCountry)}
              className="h-full px-2.5 flex items-center gap-1.5 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors shrink-0"
              title={selectedCountryObj.country}
            >
              <span>{selectedCountryObj.flag}</span>
              <span>{selectedCountryObj.code}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpenCountry ? "rotate-180" : ""}`} />
            </button>

            {/* Custom Floating Popover Menu List */}
            {isOpenCountry && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpenCountry(false)} />
                <div className="absolute top-[36px] left-0 z-50 w-64 max-h-56 overflow-y-auto bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm shadow-xl py-1">
                  {COUNTRY_CODES.map((item) => {
                    const isSelected = item.code === countryCode;
                    return (
                      <button
                        key={item.code + item.country}
                        type="button"
                        onClick={() => {
                          setCountryCode(item.code);
                          setIsOpenCountry(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-[#131b2e] transition-colors ${
                          isSelected ? "bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-700 dark:text-slate-300 font-medium"
                        }`}
                      >
                        <span className="text-sm">{item.flag}</span>
                        <span className="font-bold w-10 shrink-0">{item.code}</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate">{item.country}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="812-3456-7890"
              className="w-full h-full px-2.5 bg-transparent text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
            />
            {/* Hidden combined payload for standard form submission */}
            <input
              type="hidden"
              name="phone"
              value={phoneNumber ? `${countryCode} ${phoneNumber.trim()}` : ""}
            />
          </div>
        </div>
      </div>

      {/* Ordered Product Embedded Sub-Form */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-400">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Map Initial Order Item (Optional)</span>
          </label>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-sm border border-slate-200/60 dark:border-slate-700/60">
            <Clock className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Transaction captured automatically as precise real-time timestamp</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-slate-50/70 dark:bg-[#0b0f19]/70 rounded-sm border border-slate-200/50 dark:border-slate-800/50 transition-colors">
          {/* Active Inventory Product Selector */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Product Designation</label>
            {distinctProducts.length > 0 ? (
              <select
                name="product_name"
                value={selectedProduct}
                onChange={(e) => handleProductSelection(e.target.value)}
                className="w-full h-[34px] px-2.5 py-1.5 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              >
                <option value="">-- Select Active Inventory Asset --</option>
                {distinctProducts.map((prodName) => (
                  <option key={prodName} value={prodName}>
                    {prodName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="product_name"
                type="text"
                value={selectedProduct}
                onChange={(e) => handleProductSelection(e.target.value)}
                placeholder="e.g. Netflix Premium"
                className="w-full h-[34px] px-2.5 py-1.5 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
              />
            )}
          </div>

          {/* Variant Tier Mapping */}
          <div className="flex flex-col justify-end w-full">
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Variant Access</label>
            <select
              name="product_variant"
              value={productVariant}
              onChange={(e) => setProductVariant(e.target.value)}
              className="w-full h-[34px] px-2.5 py-1.5 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              {tierOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Preset Duration Cycles Selector */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Coverage Cycle</label>
            <select
              name="duration_days"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full h-[34px] px-2.5 py-1.5 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-indigo-900 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              <option value={1}>1 Day Pass (24h)</option>
              <option value={7}>7 Days Access (1wk)</option>
              <option value={28}>28 Days Standard</option>
              <option value={30}>30 Days Premium Sub</option>
              <option value={90}>90 Days Quarterly</option>
              <option value={365}>365 Days Annual</option>
            </select>
          </div>

          {/* Date Start Picker */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Date Start</label>
            <input
              name="date_start"
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full h-[34px] px-2.5 py-1.5 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Auto-summed / Configurable Date End Picker */}
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Date End (Auto-Sums)</label>
            <input
              name="date_end"
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full h-[34px] px-2.5 py-1.5 bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-md transition-all"
        >
          {isPending ? "Connecting Shard..." : "Create Profile & Bind Order"}
        </button>
      </div>
    </form>
  );
}
