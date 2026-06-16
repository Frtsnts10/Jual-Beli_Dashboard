"use client";

import React, { useState } from "react";
import { PlusCircle, Users } from "lucide-react";
import { createInventoryItemAction } from "../actions/inventory-actions";
import { getTierConfigForProduct } from "@/config/product-tiers";
import { Input, Select, SelectItem, Button, DatePicker } from "@heroui/react";
import { toast } from "sonner";

interface InventoryFormProps {
  storeId: string;
  currency?: string;
  onSuccess?: () => void;
}

export function InventoryForm({ storeId, currency = "IDR", onSuccess }: InventoryFormProps) {
  const [isPending, setIsPending] = useState(false);

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

    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await createInventoryItemAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Digital resale variant mapped successfully");
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
      className="p-6 bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-4 font-sans transition-colors"
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

      {/* Row 1: Asset Core */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          name="name"
          label="Product Name"
          isRequired
          value={productName}
          onValueChange={(val) => {
            setProductName(val);
            const cfg = getTierConfigForProduct(val);
            setTierVariant(cfg.defaultTier);
            setTierOptions(cfg.options);
          }}
          placeholder="e.g. YouTube Premium Family"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-bold text-slate-800 dark:text-slate-100"
          }}
        />
        <Select
          name="profile_tier"
          label="Profile Tier Variant"
          selectedKeys={[tierVariant]}
          onChange={(e) => setTierVariant(e.target.value)}
          variant="faded"
          radius="lg"
          classNames={{
            trigger: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-0",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            value: "text-xs font-semibold text-slate-800 dark:text-slate-100"
          }}
        >
          {tierOptions.map((opt) => (
            <SelectItem key={opt}>{opt}</SelectItem>
          ))}
        </Select>
        <Input
          name="profile_name"
          label="Profile Designation"
          placeholder="e.g. Member Slot Alpha"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-semibold text-slate-800 dark:text-slate-100"
          }}
        />
      </div>

      {/* Row 2: Grouping & Pool Configuration */}
      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
        <Input
          name="group_name"
          label={
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <Users className="w-3 h-3 text-indigo-500" /> Family Pool Group Designation (Optional)
            </div>
          }
          placeholder="Leave blank for auto-assignment based on name/duration parameters (Max 5/6 members)"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            input: "text-xs font-semibold text-slate-800 dark:text-slate-100"
          }}
        />
        <p className="text-[10px] text-slate-400 mt-1">
          💡 For family assets (Google, YouTube, Canva), omission triggers smart bucket filling matching active unconstrained groups automatically.
        </p>
      </div>

      {/* Row 3: Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
        <Input
          type="email"
          name="email"
          label="Account Email"
          placeholder="account@streaming.com"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs text-slate-800 dark:text-slate-100"
          }}
        />
        <Input
          type="text"
          name="password"
          label="Password"
          placeholder="••••••••"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-mono text-slate-800 dark:text-slate-100"
          }}
        />
        <Input
          type="text"
          name="pin"
          label="Profile PIN"
          placeholder="e.g. 1234"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-mono text-slate-800 dark:text-slate-100"
          }}
        />
      </div>

      {/* Row 4: Pricing & Quota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div>
          <Input
            type="text"
            inputMode="decimal"
            label={`Base Price (${currency})`}
            value={basePriceStr}
            onValueChange={setBasePriceStr}
            onBlur={() => handlePriceBlur(setBasePriceStr, basePriceStr)}
            placeholder={basePlaceholder}
            variant="faded"
            radius="lg"
            classNames={{
              inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
              label: "text-[10px] font-bold text-slate-400 uppercase",
              input: "text-xs font-bold text-slate-800 dark:text-slate-100"
            }}
          />
          <input type="hidden" name="base_price" value={parsePriceFloat(basePriceStr)} />
        </div>
        <div>
          <Input
            type="text"
            inputMode="decimal"
            label={`Selling Price (${currency})`}
            isRequired
            value={sellingPriceStr}
            onValueChange={setSellingPriceStr}
            onBlur={() => handlePriceBlur(setSellingPriceStr, sellingPriceStr)}
            placeholder={sellingPlaceholder}
            variant="faded"
            radius="lg"
            classNames={{
              inputWrapper: "bg-indigo-50/30 dark:bg-indigo-950/20 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
              label: "text-[10px] font-bold text-slate-400 uppercase",
              input: "text-xs font-bold text-indigo-900 dark:text-indigo-300"
            }}
          />
          <input type="hidden" name="selling_price" value={parsePriceFloat(sellingPriceStr)} />
        </div>
        <Input
          name="stock"
          type="number"
          label="Available Profiles (Stock)"
          defaultValue="1"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs font-semibold text-slate-800 dark:text-slate-100"
          }}
        />
      </div>

      {/* Row 5: Lifecycles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
        <DatePicker
          name="date_buy"
          label="Date Buy"
          variant="faded"
          radius="lg"
          classNames={{
            base: "h-[34px]",
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs text-slate-800 dark:text-slate-100"
          }}
        />
        <DatePicker
          name="date_expired"
          label="Date Expired"
          variant="faded"
          radius="lg"
          classNames={{
            base: "h-[34px]",
            inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 data-[focus=true]:border-indigo-500 h-[34px] min-h-[34px]",
            label: "text-[10px] font-bold text-slate-400 uppercase",
            input: "text-xs text-slate-800 dark:text-slate-100"
          }}
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          isLoading={isPending}
          color="primary"
          radius="lg"
          className="text-xs font-bold shadow-md"
        >
          {isPending ? "Mapping Variant Payload..." : "Add Digital Inventory Row"}
        </Button>
      </div>
    </form>
  );
}
