"use client";

import { useEffect } from "react";
import { Language, dictionaries } from "@/locales/dictionary";

export function LanguageInitializer({ preferredLanguage }: { preferredLanguage?: string }) {
  useEffect(() => {
    if (preferredLanguage && dictionaries[preferredLanguage as Language]) {
      const current = localStorage.getItem("dashboard-language");
      if (current !== preferredLanguage) {
        localStorage.setItem("dashboard-language", preferredLanguage);
        window.dispatchEvent(new Event("dashboard-language-changed"));
      }
    }
  }, [preferredLanguage]);

  return null;
}
