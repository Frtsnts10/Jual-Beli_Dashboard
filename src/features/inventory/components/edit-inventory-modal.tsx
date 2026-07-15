"use client";

import React, { useState } from "react";
import { InventoryItem, updateInventoryItemAction } from "../actions/inventory-actions";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Select, SelectItem, Button, DatePicker } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Eye, EyeOff } from "lucide-react";
import { getTierConfigForProduct, formatTierName } from "@/config/product-tiers";
import { ALL_CATEGORIES, getProductsForCategory } from "@/config/categories";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";

export function EditInventoryModal({
  item,
  onClose,
  storeId,
  currency = "IDR",
}: {
  item: InventoryItem;
  onClose: () => void;
  storeId: string;
  currency?: string;
}) {
  const { t } = useI18n();
  const [isPending, setIsPending] = useState(false);

  const isIDR = currency.toUpperCase() === "IDR";

  const [name, setName] = useState(item.name || "");
  const initialCfg = getTierConfigForProduct(item.name || "");
  const [profileTier, setProfileTier] = useState(item.profile_tier || initialCfg.defaultTier);
  const [tierOptions, setTierOptions] = useState<string[]>(initialCfg.options);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [category, setCategory] = useState(item.category || "");
  const [productOptions, setProductOptions] = useState<string[]>(
    item.category ? getProductsForCategory(item.category) : []
  );

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    const products = getProductsForCategory(val);
    setProductOptions(products);
    setName("");
    setProfileTier("");
    setTierOptions([]);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

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

    const formData = new FormData();
    formData.append("category", category);
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
      toast.error(res.error);
    } else {
      toast.success("Asset profile update broadcasted successfully");
      onClose();
    }
  }

  return (
    <Modal backdrop="blur" isOpen={true} onOpenChange={(open) => {
      if (!open) {
        setIsConfirmOpen(true);
      }
    }} size="2xl" scrollBehavior="inside" classNames={{
      base: "bg-white dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl",
      header: "bg-slate-50 dark:bg-[#0b0f19] border-b border-slate-100 dark:border-slate-800",
      body: "p-6 space-y-8"
    }}>
      <ModalContent>
        {(onClose) => (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.inventoryForm.editTitle}
              </h3>
            </ModalHeader>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-6">
                <Select placeholder={t.inventoryForm.selectCategory}
                  labelPlacement="outside" label={t.inventoryForm.category}
                  isRequired
                  selectedKeys={category ? [category] : []}
                  onChange={handleCategoryChange}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", trigger: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                >
                  {ALL_CATEGORIES.map((opt) => (
                    <SelectItem key={opt} textValue={opt}>{opt}</SelectItem>
                  ))}
                </Select>
                <Select placeholder={t.inventoryForm.selectProduct}
                  labelPlacement="outside" label={t.inventoryForm.productName}
                  isRequired
                  selectedKeys={name ? [name] : []}
                  onChange={handleNameChange}
                  isDisabled={!category}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", trigger: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                >
                  {productOptions.map((opt) => (
                    <SelectItem key={opt} textValue={opt}>{opt}</SelectItem>
                  ))}
                </Select>
                <Select placeholder={t.inventoryForm.selectTier}
                  labelPlacement="outside" label={t.inventoryForm.tierVariant}
                  selectedKeys={profileTier ? [profileTier] : []}
                  onChange={(e) => setProfileTier(e.target.value)}
                  isDisabled={!name}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", trigger: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                >
                  {tierOptions.map((opt) => (
                    <SelectItem key={opt} textValue={formatTierName(opt)}>{formatTierName(opt)}</SelectItem>
                  ))}
                </Select>
                <Input
                  labelPlacement="outside" label={t.inventoryForm.profileNameOpt}
                  value={profileName}
                  onValueChange={setProfileName}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
              </div>

              <Input
                labelPlacement="outside" label={t.inventoryForm.groupNameOpt}
                placeholder={t.inventoryForm.groupNamePh}
                value={groupName}
                onValueChange={setGroupName}
                variant="bordered"
                radius="lg"
                classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Input
                  type="email"
                  labelPlacement="outside" label={t.inventoryForm.accountEmail}
                  value={email}
                  onValueChange={setEmail}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
                <Input
                  type={isVisible ? "text" : "password"}
                  labelPlacement="outside" label={t.inventoryForm.password}
                  value={password}
                  onValueChange={setPassword}
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
                  labelPlacement="outside" label={t.inventoryForm.profilePin}
                  value={pin}
                  onValueChange={setPin}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Input
                  type="text"
                  inputMode="decimal"
                  labelPlacement="outside" label={`${t.inventoryForm.basePrice} (${currency})`}
                  value={basePriceStr}
                  onValueChange={setBasePriceStr}
                  onBlur={() => handlePriceBlur(setBasePriceStr, basePriceStr)}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
                <Input
                  type="text"
                  inputMode="decimal"
                  labelPlacement="outside" label={`${t.inventoryForm.sellingPrice} (${currency})`}
                  isRequired
                  value={sellingPriceStr}
                  onValueChange={setSellingPriceStr}
                  onBlur={() => handlePriceBlur(setSellingPriceStr, sellingPriceStr)}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
                <Input
                  type="number"
                  labelPlacement="outside" label={t.inventoryForm.accountStock}
                  value={stock}
                  onValueChange={setStock}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                <DatePicker
                  labelPlacement="outside" label={t.inventoryForm.purchaseDate}
                  value={dateBuy ? (parseDate(dateBuy.split("T")[0]) as any) : null}
                  onChange={(val) => setDateBuy(val ? val.toString() : "")}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
                <DatePicker
                  labelPlacement="outside" label={t.inventoryForm.expDate}
                  value={dateExpired ? (parseDate(dateExpired.split("T")[0]) as any) : null}
                  onChange={(val) => setDateExpired(val ? val.toString() : "")}
                  variant="bordered"
                  radius="lg"
                  classNames={{ label: "font-bold text-slate-700 dark:text-slate-300", inputWrapper: "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm" }}
                />
              </div>
            </ModalBody>
            <ModalFooter className="border-t border-slate-100 dark:border-slate-800">
              <Button variant="light" onPress={onClose} radius="lg" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Cancel
              </Button>
              <Button type="submit" isLoading={isPending} color="primary" radius="lg" className="text-xs font-bold shadow-md">
                {isPending ? t.inventoryForm.updatingBtn : t.inventoryForm.updateBtn}
              </Button>
            </ModalFooter>
          </form>
        )}
      </ModalContent>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onClose}
        title="Discard Changes"
        description="Are you sure you want to discard your edits? Any unsaved changes will be permanently lost."
        confirmText="Discard"
      />
    </Modal>
  );
}
