"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, ShoppingBag, Clock, ChevronDown } from "lucide-react";
import { Input, Select, SelectItem, Button, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
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
      className="p-6 bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4 font-sans transition-colors"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-600" />
          Register Customer & Order Variant
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Sediakan profil pembeli beserta aliran produk tersemat dan pemetaan durasi otomatis.
        </p>
      </div>

      {error && (
        <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg font-medium">
          {error}
        </div>
      )}

      {/* Primary Bio Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          name="name"
          label="Customer Full Name"
          isRequired
          placeholder="Cth: Alex Rivera"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[52px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-bold text-slate-800 dark:text-slate-100"
          }}
        />
        <Input
          name="email"
          type="email"
          label="Email Connection"
          placeholder="alex@domain.com"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[52px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs text-slate-800 dark:text-slate-100"
          }}
        />
        <div>
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
            <div className="flex items-center w-full h-[34px] bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-lg focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-colors relative">
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
                <div className="absolute top-[36px] left-0 z-50 w-64 max-h-56 overflow-y-auto bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1">
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
      </div>

      {/* Ordered Product Embedded Sub-Form */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-400">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Petakan Item Pesanan Awal (Opsional)</span>
          </label>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
            <Clock className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span>Transaksi ditangkap otomatis dengan stempel waktu real-time yang akurat</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-slate-50/70 dark:bg-[#0b0f19]/70 rounded-lg border border-slate-200/50 dark:border-slate-800/50 transition-colors items-end">
          {/* Active Inventory Product Selector */}
          <div className="flex flex-col">
            {distinctProducts.length > 0 ? (
              <Select
                name="product_name"
                label="Product Designation"
                labelPlacement="outside"
                selectedKeys={[selectedProduct]}
                onChange={(e) => handleProductSelection(e.target.value)}
                variant="faded"
                radius="lg"
                classNames={{
                  trigger: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-0",
                  label: "text-[9px] font-bold text-slate-400 uppercase",
                  value: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              >
                {distinctProducts.map((prodName) => (
                  <SelectItem key={prodName}>{prodName}</SelectItem>
                ))}
              </Select>
            ) : (
              <Input
                name="product_name"
                label="Product Designation"
                labelPlacement="outside"
                value={selectedProduct}
                onValueChange={(val) => handleProductSelection(val)}
                placeholder="e.g. Netflix Premium"
                variant="faded"
                radius="lg"
                classNames={{
                  inputWrapper: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
                  label: "text-[9px] font-bold text-slate-400 uppercase",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100"
                }}
              />
            )}
          </div>

          {/* Variant Tier Mapping */}
          <div className="flex flex-col">
            <Select
              name="product_variant"
              label="Variant Access"
              labelPlacement="outside"
              selectedKeys={[productVariant]}
              onChange={(e) => setProductVariant(e.target.value)}
              variant="faded"
              radius="lg"
              classNames={{
                trigger: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-0",
                label: "text-[9px] font-bold text-slate-400 uppercase",
                value: "text-xs font-semibold text-slate-800 dark:text-slate-100"
              }}
            >
              {tierOptions.map((opt) => (
                <SelectItem key={opt}>{opt}</SelectItem>
              ))}
            </Select>
          </div>

          {/* Preset Duration Cycles Selector */}
          <div className="flex flex-col">
            <Select
              name="duration_days"
              label="Coverage Cycle"
              labelPlacement="outside"
              selectedKeys={[durationDays.toString()]}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              variant="faded"
              radius="lg"
              classNames={{
                trigger: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-0",
                label: "text-[9px] font-bold text-slate-400 uppercase",
                value: "text-xs font-bold text-indigo-900 dark:text-indigo-300"
              }}
            >
              <SelectItem key="1">1 Day Pass (24h)</SelectItem>
              <SelectItem key="7">7 Days Access (1wk)</SelectItem>
              <SelectItem key="28">28 Days Standard</SelectItem>
              <SelectItem key="30">30 Days Premium Sub</SelectItem>
              <SelectItem key="90">90 Days Quarterly</SelectItem>
              <SelectItem key="365">365 Days Annual</SelectItem>
            </Select>
          </div>

          {/* Date Start Picker */}
          <div className="flex flex-col">
            <DatePicker
              name="date_start"
              label="Date Start"
              labelPlacement="outside"
              value={dateStart ? (parseDate(dateStart) as any) : null}
              onChange={(val) => setDateStart(val ? val.toString() : "")}
              variant="faded"
              radius="lg"
              classNames={{
                base: "h-[34px]",
                inputWrapper: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-[34px]",
                label: "text-[9px] font-bold text-slate-400 uppercase",
                input: "text-xs font-medium text-slate-800 dark:text-slate-100"
              }}
            />
            <input type="hidden" name="date_start" value={dateStart} />
          </div>

          {/* Auto-summed / Configurable Date End Picker */}
          <div className="flex flex-col">
            <DatePicker
              name="date_end"
              label="Date End (Auto-Sums)"
              labelPlacement="outside"
              value={dateEnd ? (parseDate(dateEnd) as any) : null}
              onChange={(val) => setDateEnd(val ? val.toString() : "")}
              variant="faded"
              radius="lg"
              classNames={{
                base: "h-[34px]",
                inputWrapper: "bg-white dark:bg-[#0d1322] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-[34px]",
                label: "text-[9px] font-bold text-slate-400 uppercase",
                input: "text-xs font-bold text-emerald-700 dark:text-emerald-400"
              }}
            />
            <input type="hidden" name="date_end" value={dateEnd} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          isLoading={isPending}
          color="primary"
          radius="lg"
          className="px-5 font-bold shadow-md h-[40px] text-xs"
        >
          {isPending ? "Connecting Toko..." : "Buat Profil & Ikat Pesanan"}
        </Button>
      </div>
    </form>
  );
}
