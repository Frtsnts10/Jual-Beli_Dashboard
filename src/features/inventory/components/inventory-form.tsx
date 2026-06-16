"use client";

import React, { useState } from "react";
import { PlusCircle, Users, Eye, EyeOff } from "lucide-react";
import { createInventoryItemAction } from "../actions/inventory-actions";
import { getTierConfigForProduct, formatTierName } from "@/config/product-tiers";
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

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

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
      className="p-6 space-y-8 font-sans transition-colors"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6">
        <Input
          name="name"
          labelPlacement="outside" label="Product Name"
          isRequired
          value={productName}
          onValueChange={(val) => {
            setProductName(val);
            const cfg = getTierConfigForProduct(val);
            setTierVariant(cfg.defaultTier);
            setTierOptions(cfg.options);
          }}
          placeholder="e.g. YouTube Premium Family"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <Select placeholder="Select tier..."
          name="profile_tier"
          labelPlacement="outside" label="Profile Tier Variant"
          selectedKeys={[tierVariant]}
          onChange={(e) => setTierVariant(e.target.value)}
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", trigger: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        >
          {tierOptions.map((opt) => (
            <SelectItem key={opt} textValue={formatTierName(opt)}>{formatTierName(opt)}</SelectItem>
          ))}
        </Select>
        <Input
          name="profile_name"
          labelPlacement="outside" label="Profile Designation"
          placeholder="e.g. Member Slot Alpha"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
      </div>

      {/* Row 2: Grouping & Pool Configuration */}
      <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
        <Input
          name="group_name"
          labelPlacement="outside" label={
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
              <Users className="w-3 h-3 text-indigo-500" /> Family Pool Group Designation (Optional)
            </div>
          }
          placeholder="Leave blank for auto-assignment based on name/duration parameters (Max 5/6 members)"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <p className="text-[10px] text-slate-400 mt-1">
          💡 For family assets (Google, YouTube, Canva), omission triggers smart bucket filling matching active unconstrained groups automatically.
        </p>
      </div>

      {/* Row 3: Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
        <Input
          type="email"
          name="email"
          labelPlacement="outside" label="Account Email"
          placeholder="account@streaming.com"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <Input
          type={isVisible ? "text" : "password"}
          name="password"
          labelPlacement="outside" label="Password"
          placeholder="••••••••"
          variant="bordered"
          radius="lg"
          endContent={
            <button className="focus:outline-none" type="button" onClick={toggleVisibility}>
              {isVisible ? (
                <EyeOff className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <Eye className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <Input
          type="text"
          name="pin"
          labelPlacement="outside" label="Profile PIN"
          placeholder="e.g. 1234"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
      </div>

      {/* Row 4: Pricing & Quota */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
        <div>
          <Input
            type="text"
            inputMode="decimal"
            labelPlacement="outside" label={`Base Price (${currency})`}
            value={basePriceStr}
            onValueChange={setBasePriceStr}
            onBlur={() => handlePriceBlur(setBasePriceStr, basePriceStr)}
            placeholder={basePlaceholder}
            variant="bordered"
            radius="lg"
            classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
          />
          <input type="hidden" name="base_price" value={parsePriceFloat(basePriceStr)} />
        </div>
        <div>
          <Input
            type="text"
            inputMode="decimal"
            labelPlacement="outside" label={`Selling Price (${currency})`}
            isRequired
            value={sellingPriceStr}
            onValueChange={setSellingPriceStr}
            onBlur={() => handlePriceBlur(setSellingPriceStr, sellingPriceStr)}
            placeholder={sellingPlaceholder}
            variant="bordered"
            radius="lg"
            classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
          />
          <input type="hidden" name="selling_price" value={parsePriceFloat(sellingPriceStr)} />
        </div>
        <Input
          name="stock"
          type="number"
          labelPlacement="outside" label="Available Profiles (Stock)"
          defaultValue="1"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
      </div>

      {/* Row 5: Lifecycles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
        <DatePicker
          name="date_buy"
          labelPlacement="outside" label="Date Buy"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
        />
        <DatePicker
          name="date_expired"
          labelPlacement="outside" label="Date Expired"
          variant="bordered"
          radius="lg"
          classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
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
