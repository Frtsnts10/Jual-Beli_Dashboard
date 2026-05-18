"use client";

import React, { useState, useEffect } from "react";

const translations = {
  id: {
    pageTitle: "Manajemen Identitas Ruang Kerja",
    pageSubtitle: "Konfigurasi tanda tangan domain, logo merek, dan parameter mata uang global."
  },
  en: {
    pageTitle: "Workspace Identity Bindings",
    pageSubtitle: "Configure domain signatures, brand logos, and global currency parameters."
  },
  es: {
    pageTitle: "Vínculos de Identidad del Espacio de Trabajo",
    pageSubtitle: "Configure firmas de dominio, logotipos de marca y parámetros de moneda global."
  },
  fr: {
    pageTitle: "Identité de l'Espace de Travail",
    pageSubtitle: "Configurez les signatures de domaine, les logos de marque et les devises globales."
  },
  de: {
    pageTitle: "Arbeitsbereich-Identitätsbindungen",
    pageSubtitle: "Konfigurieren Sie Domänensignaturen, Markenlogos und globale Währungsparameter."
  },
  ja: {
    pageTitle: "ワークスペースID連携",
    pageSubtitle: "ドメイン署名、ブランドロゴ、グローバル通貨パラメータを設定します。"
  },
  zh: {
    pageTitle: "工作空间身份绑定",
    pageSubtitle: "配置域名签名、品牌徽标以及全局货币参数。"
  }
};

export function SettingsHeader() {
  const [lang, setLang] = useState<keyof typeof translations>("id");

  useEffect(() => {
    const savedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof translations;
    if (translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const t = translations[lang] || translations.id;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t.pageTitle}</h2>
      <p className="text-xs text-slate-500 mt-0.5">
        {t.pageSubtitle}
      </p>
    </div>
  );
}
