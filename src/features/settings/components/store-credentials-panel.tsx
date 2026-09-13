"use client";

import React, { useState } from "react";
import { KeyRound, Copy, CheckCircle2 } from "lucide-react";
import { Input, Button } from "@heroui/react";
import { useI18n } from "@/hooks/use-i18n";

export function StoreCredentialsPanel({ storeId }: { storeId: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { t } = useI18n();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#0d1322] rounded-xl border border-stone-200/60 dark:border-slate-800/80 shadow-sm p-6 relative overflow-hidden transition-colors">
      <h3 className="text-sm font-bold text-stone-900 dark:text-slate-100 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-amber-500" />
        {t.settings.credentialsTitle}
      </h3>
      <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 mb-5 leading-relaxed">
        {t.settings.credentialsSubtitle}
      </p>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {t.settings.labelWorkspaceId}
          </label>
          <Input 
            readOnly
            aria-label={t.settings.labelWorkspaceId}
            value={storeId}
            size="sm"
            classNames={{
              inputWrapper: "bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-none",
              input: "text-xs font-bold text-stone-500 dark:text-slate-400 font-mono",
            }}
            endContent={
              <button 
                type="button"
                onClick={() => copyToClipboard(storeId, "storeId")}
                className="text-stone-400 hover:text-blue-500 transition-colors focus:outline-none"
              >
                {copiedId === "storeId" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {t.settings.labelPublicKey}
          </label>
          <Input 
            readOnly
            aria-label={t.settings.labelPublicKey}
            value={t.settings.comingSoon}
            size="sm"
            classNames={{
              inputWrapper: "bg-stone-50 dark:bg-[#0b0f19] border border-stone-200 dark:border-slate-800 focus-within:bg-white dark:focus-within:bg-[#131b2e] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-none",
              input: "text-xs font-bold text-stone-500 dark:text-slate-400 italic",
            }}
          />
        </div>
      </div>
    </div>
  );
}
