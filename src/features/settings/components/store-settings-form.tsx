"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Input, Select, SelectItem, Button } from "@heroui/react";
import { Save, AlertOctagon, Image as ImageIcon, Globe, Upload, Sun, Moon, Monitor } from "lucide-react";
import { updateStoreSettingsAction, deleteStoreAction, updateStoreApiKeysAction } from "../actions/settings-actions";
import { useI18n } from "@/hooks/use-i18n";
import { Language } from "@/locales/dictionary";
import { countryCodes } from "@/lib/country-codes";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface StoreProfileFormProps {
  storeId: string;
  initialName: string;
  initialLogo?: string;
  initialEmail?: string;
  initialInstagram?: string;
  initialWhatsapp?: string;
}

export function StoreProfileForm({ 
  storeId, 
  initialName, 
  initialLogo = "", 
  initialEmail = "",
  initialInstagram = "",
  initialWhatsapp = ""
}: StoreProfileFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const { t } = useI18n();
  
  // WhatsApp State
  const [whatsappCountry, setWhatsappCountry] = useState("+62");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    const match = initialWhatsapp.match(/^(\+\d+)\s*(.*)$/);
    if (match) {
      setWhatsappCountry(match[1]);
      setWhatsappNumber(match[2]);
    } else {
      setWhatsappNumber(initialWhatsapp);
    }
  }, [initialWhatsapp]);

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

    const formData = new FormData(e.currentTarget);
    formData.set("logo_url", logoPreview);
    
    if (whatsappNumber) {
      formData.set("whatsapp", `${whatsappCountry} ${whatsappNumber}`);
    } else {
      formData.delete("whatsapp");
    }

    let insta = formData.get("instagram") as string;
    if (insta) {
      if (!insta.startsWith('@')) {
        insta = '@' + insta;
      }
      formData.set("instagram", insta);
    }

    const res = await updateStoreSettingsAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(t.settings.tenantSuccess);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col p-4 sm:p-6 bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.settings.tenantTitle}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{t.settings.tenantSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.settings.labelWorkspaceName}
          </label>
          <Input
            name="name"
            isRequired
            defaultValue={initialName}
            radius="lg"
            classNames={{
              inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
              input: "text-xs font-bold text-slate-800 dark:text-slate-100",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.settings.labelStoreEmail}
          </label>
          <Input
            name="email"
            type="email"
            defaultValue={initialEmail}
            radius="lg"
            classNames={{
              inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
              input: "text-xs font-bold text-slate-800 dark:text-slate-100",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.settings.labelWhatsapp}
          </label>
          <Input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            radius="lg"
            startContent={
              <div className="flex items-center h-full">
                <select
                  value={whatsappCountry}
                  onChange={(e) => setWhatsappCountry(e.target.value)}
                  className="outline-none border-0 bg-transparent text-slate-500 text-xs font-bold w-[90px] cursor-pointer"
                >
                  {countryCodes.map((c) => (
                    <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
                      {c.code} ({c.dialCode})
                    </option>
                  ))}
                </select>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
              </div>
            }
            classNames={{
              inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none pl-2",
              input: "text-xs font-bold text-slate-800 dark:text-slate-100",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.settings.labelInstagram}
          </label>
          <Input
            name="instagram"
            defaultValue={initialInstagram.replace(/^@/, '')}
            radius="lg"
            startContent={<span className="text-slate-500 text-xs font-bold select-none pr-0.5">@</span>}
            classNames={{
              inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none pl-3",
              input: "text-xs font-bold text-slate-800 dark:text-slate-100",
            }}
          />
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {t.settings.labelLogoTitle}
        </label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-300" />
            )}
          </div>
          <div className="space-y-1">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
              <Upload className="w-3 h-3 text-slate-500" /> {t.settings.btnChooseGraphic}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            <p className="text-[10px] text-slate-400">{t.settings.labelLogoDesc}</p>
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="submit"
          isLoading={isPending}
          color="primary"
          radius="lg"
          startContent={!isPending && <Save className="w-3.5 h-3.5" />}
          className="text-xs font-bold shadow-sm px-4 h-9"
        >
          {isPending ? t.settings.btnSavingSettings : t.settings.btnSaveSettings}
        </Button>
      </div>
    </form>
  );
}

interface StorePreferencesFormProps {
  storeId: string;
  initialCurrency?: string;
}

export function StorePreferencesForm({ storeId, initialCurrency = "IDR" }: StorePreferencesFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [currency, setCurrency] = useState(initialCurrency.toUpperCase());
  const { t, changeLanguage, lang } = useI18n();

  const handleLanguageChange = (val: string) => {
    changeLanguage(val as Language);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);

    const formData = new FormData();
    formData.set("currency", currency);

    const res = await updateStoreSettingsAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Preferences saved successfully.");
    }
  }

  const currencies = useMemo(() => {
    return [
      { code: "USD", symbol: "$", name: "US Dollar" },
      { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
      { code: "EUR", symbol: "€", name: "Euro" },
      { code: "GBP", symbol: "£", name: "British Pound" },
      { code: "JPY", symbol: "¥", name: "Japanese Yen" },
      { code: "AUD", symbol: "A$", name: "Australian Dollar" },
      { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
      { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
      { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    ];
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col p-4 sm:p-6 bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors"
    >
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Global Preferences Matrix</h3>
        <p className="text-xs text-slate-500 mt-0.5">Configure global preferences such as language and base currency.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-500" /> {t.settings.labelGlobalCurrency}
          </label>
          <Select
            selectedKeys={new Set([currency])}
            onChange={(e) => setCurrency(e.target.value)}
            radius="lg"
            classNames={{
              trigger: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-[#131b2e] shadow-none min-h-[36px] h-9",
              value: "text-xs font-bold text-slate-800 dark:text-slate-100",
            }}
          >
            {currencies.map((c) => (
              <SelectItem key={c.code} textValue={`${c.code} ${c.name}`}>
                {c.code} ({c.symbol}) — {c.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-500" /> {t.settings.labelLanguage}
          </label>
          <Select
            selectedKeys={new Set([lang])}
            onChange={(e) => handleLanguageChange(e.target.value)}
            radius="lg"
            classNames={{
              trigger: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-[#131b2e] shadow-none min-h-[36px] h-9",
              value: "text-xs font-bold text-slate-800 dark:text-slate-100",
            }}
          >
            <SelectItem key="id" textValue="Bahasa Indonesia">🇮🇩 Bahasa Indonesia</SelectItem>
            <SelectItem key="en" textValue="English">🇺🇸 English</SelectItem>
            <SelectItem key="es" textValue="Español">🇪🇸 Español</SelectItem>
            <SelectItem key="fr" textValue="Français">🇫🇷 Français</SelectItem>
            <SelectItem key="de" textValue="Deutsch">🇩🇪 Deutsch</SelectItem>
            <SelectItem key="ja" textValue="日本語">🇯🇵 日本語</SelectItem>
            <SelectItem key="zh" textValue="中文">🇨🇳 中文</SelectItem>
          </Select>
        </div>
      </div>

      <div className="mt-auto flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button
          type="submit"
          isLoading={isPending}
          color="primary"
          radius="lg"
          startContent={!isPending && <Save className="w-3.5 h-3.5" />}
          className="text-xs font-bold shadow-sm px-4 h-9"
        >
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </form>
  );
}

export function DangerZonePanel({ storeId }: { storeId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useI18n();

  async function handleDelete() {
    await deleteStoreAction(storeId);
  }

  return (
    <>
      <div className="p-4 sm:p-6 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/40 space-y-3 transition-colors">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600" />
          <h3 className="text-xs font-bold text-red-950 dark:text-red-400 uppercase tracking-wider">
            {t.settings.dangerTitle}
          </h3>
        </div>
        <p className="text-xs text-red-800/80 dark:text-red-300/80 leading-relaxed max-w-2xl">
          {t.settings.dangerDesc}
        </p>
        <div>
          <Button
            type="button"
            onPress={() => setIsModalOpen(true)}
            color="danger"
            radius="lg"
            className="text-xs font-bold shadow-sm px-4 h-9"
          >
            {t.settings.btnPurge}
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Workspace Deletion"
        description="CRITICAL WARNING: This action drops the tenant partition and cascades deletion across all bounded inventory, customer vectors, and ticket rows. Confirm drop?"
        confirmText={t.settings.btnPurging}
        danger
      />
    </>
  );
}

export function AppearanceSettingsPanel() {
  const [activeTheme, setActiveTheme] = useState("system");
  const { t } = useI18n();

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "system";
    // eslint-disable-next-line
    setActiveTheme(theme);
  }, []);

  const handleThemeChange = (themeName: string) => {
    setActiveTheme(themeName);
    localStorage.setItem("theme", themeName);
    if (themeName === "dark" || (themeName === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-[#0d1322] rounded-lg border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-3 transition-colors">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-indigo-500" /> {t.settings.appearanceTitle}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">{t.settings.appearanceSubtitle}</p>
      </div>

      <div className="inline-flex p-1 bg-slate-100 dark:bg-[#0b0f19] rounded-lg border border-slate-200/80 dark:border-slate-800 gap-1 text-xs font-bold w-full">
        <Button
          type="button"
          onPress={() => handleThemeChange("system")}
          radius="lg"
          variant={activeTheme === "system" ? "solid" : "light"}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 ${
            activeTheme === "system"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>{t.settings.themeSystem}</span>
        </Button>
        <Button
          type="button"
          onPress={() => handleThemeChange("light")}
          radius="lg"
          variant={activeTheme === "light" ? "solid" : "light"}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 ${
            activeTheme === "light"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>{t.settings.themeLight}</span>
        </Button>
        <Button
          type="button"
          onPress={() => handleThemeChange("dark")}
          radius="lg"
          variant={activeTheme === "dark" ? "solid" : "light"}
          className={`flex-1 flex items-center justify-center gap-1.5 h-8 ${
            activeTheme === "dark"
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>{t.settings.themeDark}</span>
        </Button>
      </div>
    </div>
  );
}

export function IntegrationsForm({ 
  storeId,
  initialMidtransServerKey = "",
  initialMidtransClientKey = ""
}: {
  storeId: string;
  initialMidtransServerKey?: string;
  initialMidtransClientKey?: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const { t } = useI18n();

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    const res = await updateStoreApiKeysAction(storeId, formData);
    setIsPending(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("API keys updated successfully!");
    }
  }

  return (
    <div className="bg-white dark:bg-[#0d1322] rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 relative overflow-hidden transition-colors">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-indigo-500" />
        API Integrations & Keys
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        Configure your payment gateways. These keys are used on your storefront to process customer transactions directly into your merchant account.
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-6">
          {/* Midtrans */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">Midtrans</h4>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Server Key
              </label>
              <Input 
                name="midtrans_server_key"
                defaultValue={initialMidtransServerKey}
                placeholder="SB-Mid-server-..."
                type="password"
                size="sm"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-none",
                }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Client Key
              </label>
              <Input 
                name="midtrans_client_key"
                defaultValue={initialMidtransClientKey}
                placeholder="SB-Mid-client-..."
                size="sm"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-none",
                }}
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            isLoading={isPending}
            className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold tracking-wide shadow-md"
          >
            {isPending ? "Saving Keys..." : "Save API Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}

