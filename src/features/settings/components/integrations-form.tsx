"use client";

import React, { useState } from "react";
import { Button, Input } from "@heroui/react";
import { Globe } from "lucide-react";
import { updateStoreApiKeysAction } from "../actions/settings-actions";
import { toast } from "sonner";
import { useI18n } from "@/hooks/use-i18n";

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
      toast.success(t.settings.successApiKeys);
    }
  }

  return (
    <div className="bg-white dark:bg-[#0d1322] rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm p-6 relative overflow-hidden transition-colors">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <Globe className="w-4 h-4 text-indigo-500" />
        {t.settings.integrationsTitle}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-5 leading-relaxed">
        {t.settings.integrationsSubtitle}
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-6">
          {/* Midtrans */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1">Midtrans</h4>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.settings.labelServerKey}
              </label>
              <Input 
                name="midtrans_server_key"
                aria-label={t.settings.labelServerKey}
                defaultValue={initialMidtransServerKey}
                placeholder="SB-Mid-server-..."
                type="password"
                size="sm"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t.settings.labelClientKey}
              </label>
              <Input 
                name="midtrans_client_key"
                aria-label={t.settings.labelClientKey}
                defaultValue={initialMidtransClientKey}
                placeholder="SB-Mid-client-..."
                size="sm"
                classNames={{
                  inputWrapper: "bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 shadow-none",
                  input: "text-xs font-bold text-slate-800 dark:text-slate-100",
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
            {isPending ? t.settings.btnSavingApiKeys : t.settings.btnSaveApiKeys}
          </Button>
        </div>
      </form>
    </div>
  );
}
