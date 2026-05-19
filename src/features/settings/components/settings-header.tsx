"use client";

import React from "react";
import { useI18n } from "@/hooks/use-i18n";

export function SettingsHeader() {
  const { t } = useI18n();

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t.header.pageTitle}</h2>
      <p className="text-xs text-slate-500 mt-0.5">
        {t.header.pageSubtitle}
      </p>
    </div>
  );
}
