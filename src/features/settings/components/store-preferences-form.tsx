"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Select, SelectItem, Button } from "@heroui/react";
import { Save, Globe } from "lucide-react";
import { updateStoreSettingsAction } from "../actions/settings-actions";
import { updateUserLanguageAction } from "@/features/auth/actions/update-language-action";
import { useI18n } from "@/hooks/use-i18n";
import { Language } from "@/locales/dictionary";
import { toast } from "sonner";

interface StorePreferencesFormProps {
  storeId: string;
  initialCurrency?: string;
}

export function StorePreferencesForm({ storeId, initialCurrency = "IDR" }: StorePreferencesFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [currency, setCurrency] = useState(initialCurrency.toUpperCase());
  const { t, changeLanguage, lang } = useI18n();
  const [selectedLang, setSelectedLang] = useState<string>(lang);

  useEffect(() => {
    setSelectedLang(lang);
  }, [lang]);

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
      if (selectedLang !== lang && selectedLang) {
        await updateUserLanguageAction(selectedLang as Language);
        changeLanguage(selectedLang as Language);
      } else {
        toast.success(t.settings.successPreferences);
      }
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
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.settings.preferencesTitle}</h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-5">{t.settings.preferencesSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3 h-3 text-indigo-500" /> {t.settings.labelGlobalCurrency}
          </label>
          <Select
            aria-label={t.settings.labelGlobalCurrency}
            selectedKeys={new Set([currency])}
            onChange={(e) => setCurrency(e.target.value)}
            radius="lg"
            classNames={{
              trigger: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
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
            aria-label={t.settings.labelLanguage}
            selectedKeys={new Set([selectedLang])}
            onChange={(e) => setSelectedLang(e.target.value)}
            radius="lg"
            classNames={{
              trigger: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
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
          {isPending ? t.settings.btnSavingPreferences : t.settings.btnSavePreferences}
        </Button>
      </div>
    </form>
  );
}
