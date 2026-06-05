"use client";

import { useState, useEffect } from "react";
import { dictionaries, Language, Dictionary } from "@/locales/dictionary";

export function useI18n() {
  const [lang, setLang] = useState<Language>("id");

  useEffect(() => {
    // Read initial language on mount
    const savedLang = (localStorage.getItem("dashboard-language") || "id") as Language;
    if (dictionaries[savedLang]) {
      // eslint-disable-next-line
      setLang(savedLang);
    }

    // Listen to live updates from other components
    const handleLangChange = () => {
      const updatedLang = (localStorage.getItem("dashboard-language") || "id") as Language;
      if (dictionaries[updatedLang]) {
        setLang(updatedLang);
      }
    };

    window.addEventListener("dashboard-language-changed", handleLangChange);
    return () => {
      window.removeEventListener("dashboard-language-changed", handleLangChange);
    };
  }, []);

  const changeLanguage = (newLang: Language) => {
    if (!dictionaries[newLang]) return;
    localStorage.setItem("dashboard-language", newLang);
    window.dispatchEvent(new Event("dashboard-language-changed"));
    // Auto-refresh the page as requested
    window.location.reload();
  };

  const t = dictionaries[lang] || dictionaries.id;

  return {
    lang,
    t,
    changeLanguage,
    supportedLanguages: Object.keys(dictionaries) as Language[]
  };
}
