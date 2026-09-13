"use client";

import React from "react";
import { useI18n } from "@/hooks/use-i18n";

export function ProfileHeader() {
  const { t } = useI18n();
  
  return (
    <div className="pb-6 border-b border-stone-200 dark:border-slate-800">
      <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
        {t.profile.profileTitle}
      </h1>
      <p className="text-sm text-stone-500 mt-1">
        {t.profile.profileSubtitle}
      </p>
    </div>
  );
}
