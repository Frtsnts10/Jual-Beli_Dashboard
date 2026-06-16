"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Monitor, Sun, Moon } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";

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
        <p className="text-xs text-slate-500 mt-0.5 mb-5">{t.settings.appearanceSubtitle}</p>
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
