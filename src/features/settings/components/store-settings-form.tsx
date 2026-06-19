"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Input, Select, SelectItem, Button } from "@heroui/react";
import { Save, AlertOctagon, Image as ImageIcon, Globe, Upload, Sun, Moon, Monitor } from "lucide-react";
import { updateStoreSettingsAction, deleteStoreAction, updateStoreApiKeysAction } from "../actions/settings-actions";
import { useI18n } from "@/hooks/use-i18n";
import { Language } from "@/locales/dictionary";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { PhoneInput } from "@/components/ui/phone-input";

interface StoreProfileFormProps {
  storeId: string;
  initialName: string;
  initialLogo?: string;
  initialEmail?: string;
  initialInstagram?: string;
  initialWhatsapp?: string;
  initialBio?: string;
}

export function StoreProfileForm({ 
  storeId, 
  initialName, 
  initialLogo = "", 
  initialEmail = "",
  initialInstagram = "",
  initialWhatsapp = "",
  initialBio = ""
}: StoreProfileFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const { t } = useI18n();
  
  // WhatsApp State
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp);

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
    
    if (whatsapp) {
      formData.set("whatsapp", whatsapp);
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
        <p className="text-xs text-slate-500 mt-0.5 mb-5">{t.settings.tenantSubtitle}</p>
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
          <PhoneInput
            label=""
            value={whatsapp}
            onChange={setWhatsapp}
            placeholder="8xx-xxxx-xxxx"
            variant="faded"
            radius="lg"
            classNames={{
              inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none pl-0",
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

        <div className="space-y-1.5 sm:col-span-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.settings.labelStoreBio || "Store Bio / Description"}
          </label>
          <textarea
            name="bio"
            defaultValue={initialBio}
            placeholder="Tell your customers about your store..."
            className="w-full min-h-[80px] bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:bg-white dark:focus:bg-[#131b2e] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-none rounded-lg p-3 text-xs font-bold text-slate-800 dark:text-slate-100 resize-y"
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


