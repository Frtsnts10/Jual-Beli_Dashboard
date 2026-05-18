"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Save, AlertOctagon, Image as ImageIcon, Globe, Upload, Sun, Moon, Monitor } from "lucide-react";
import { updateStoreSettingsAction, deleteStoreAction } from "../actions/settings-actions";

const translations = {
  id: {
    tenantTitle: "Properti Toko & Workspace",
    tenantSubtitle: "Ubah tanda tangan publik, logo terkompresi otomatis, dan deskriptor mata uang dasar.",
    tenantSuccess: "Matriks konfigurasi ruang kerja berhasil disinkronkan ke memori persisten Supabase.",
    labelWorkspaceName: "Nama Workspace / Toko",
    labelGlobalCurrency: "Mata Uang Preferensi Global",
    labelLanguage: "Preferensi Bahasa (Language)",
    labelStoreEmail: "Alamat Email Toko",
    labelWhatsapp: "Nomor Dukungan WhatsApp (misal: 6281...)",
    labelInstagram: "Nama Pengguna Profil Instagram (Instagram Handle)",
    labelLogoTitle: "Matriks Logo Merek (Ukuran Otomatis Kontainer Klien)",
    labelLogoDesc: "Gambar yang diunggah dikompresi secara dinamis melalui buffer kanvas lokal untuk payload WEBP yang optimal.",
    btnChooseGraphic: "Pilih Gambar",
    btnSaveSettings: "Simpan Properti Toko",
    btnSavingSettings: "Menerapkan Mutasi Shard...",

    appearanceTitle: "Preferensi Tampilan Antarmuka",
    appearanceSubtitle: "Konfigurasikan parameter pemetaan warna sistem secara instan. Pilihan memicu sinkronisasi penyimpanan lokal yang persisten secara real-time.",
    themeSystem: "Sistem",
    themeLight: "Terang",
    themeDark: "Gelap",

    dangerTitle: "Area Penghapusan Bahaya",
    dangerDesc: "Menghapus instans ruang kerja ini secara permanen dari server. Tindakan ini tidak dapat dibatalkan. Semua data terkait akan terhapus selamanya.",
    btnPurge: "Hapus Instans Ruang Kerja",
    btnPurging: "Menghapus Shard..."
  },
  en: {
    tenantTitle: "Tenant Properties Matrix",
    tenantSubtitle: "Modify public alias signatures, high-fidelity auto-compressed logos, and base currency descriptors.",
    tenantSuccess: "Workspace configuration matrix synchronised to persistent Supabase memory successfully.",
    labelWorkspaceName: "Workspace Designation",
    labelGlobalCurrency: "Global Preferences Currency",
    labelLanguage: "Language Preferences (Bahasa)",
    labelStoreEmail: "Store Email Address",
    labelWhatsapp: "WhatsApp Support Number (e.g. 6281...)",
    labelInstagram: "Instagram Profile Handle",
    labelLogoTitle: "Brand Logo Matrix (Auto-Resized Client Container)",
    labelLogoDesc: "Uploaded images compress dynamically via local canvas buffers to optimal lightweight WEBP payloads.",
    btnChooseGraphic: "Choose Graphic",
    btnSaveSettings: "Save Properties Matrix",
    btnSavingSettings: "Applying Shard Mutations...",

    appearanceTitle: "Interface Appearance Preferences",
    appearanceSubtitle: "Configure system color mapping parameters instantly. Selections trigger real-time persistent local storage syncing.",
    themeSystem: "System",
    themeLight: "Light",
    themeDark: "Dark",

    dangerTitle: "Danger Deletion Area",
    dangerDesc: "Instantly drops the active shard pointer and deletes memory footprints irrevocably. Data exports must be captured prior to triggering execution.",
    btnPurge: "Purge Workspace Instance",
    btnPurging: "Dropping Shard..."
  },
  es: {
    tenantTitle: "Matriz de Propiedades del Inquilino",
    tenantSubtitle: "Modifique las firmas de alias públicos, logotipos y descriptores de moneda.",
    tenantSuccess: "Matriz de configuración del espacio de trabajo sincronizada con éxito en Supabase.",
    labelWorkspaceName: "Designación del Espacio de Trabajo",
    labelGlobalCurrency: "Moneda de Preferencia Global",
    labelLanguage: "Preferencias de Idioma (Idioma)",
    labelStoreEmail: "Dirección de Correo de la Tienda",
    labelWhatsapp: "Número de Soporte de WhatsApp (ej. 6281...)",
    labelInstagram: "Nombre de Perfil de Instagram",
    labelLogoTitle: "Matriz del Logo de la Marca (Tamaño Automático)",
    labelLogoDesc: "Las imágenes subidas se comprimen localmente mediante un lienzo para generar archivos WEBP ligeros.",
    btnChooseGraphic: "Elegir Gráfico",
    btnSaveSettings: "Guardar Matriz de Propiedades",
    btnSavingSettings: "Aplicando Mutaciones de Shard...",

    appearanceTitle: "Preferencias de Apariencia de la Interfaz",
    appearanceSubtitle: "Configure los parámetros de color del sistema de forma instantánea.",
    themeSystem: "Sistema",
    themeLight: "Claro",
    themeDark: "Oscuro",

    dangerTitle: "Área de Eliminación Peligrosa",
    dangerDesc: "Elimina de forma irreversible el espacio de trabajo activo y todos sus registros.",
    btnPurge: "Purgar Instancia de Espacio de Trabajo",
    btnPurging: "Purgando Shard..."
  },
  fr: {
    tenantTitle: "Propriétés de la Boutique",
    tenantSubtitle: "Modifiez les signatures publiques, les logos et la devise de base.",
    tenantSuccess: "Matrice de configuration de l'espace de travail synchronisée sur Supabase.",
    labelWorkspaceName: "Nom de l'Espace de Travail",
    labelGlobalCurrency: "Devise Globale Préférée",
    labelLanguage: "Préférences Linguistiques (Langue)",
    labelStoreEmail: "E-mail de la Boutique",
    labelWhatsapp: "Numéro WhatsApp (ex. 6281...)",
    labelInstagram: "Identifiant Instagram",
    labelLogoTitle: "Logo de Marque (Taille Automatique)",
    labelLogoDesc: "Les images se compressent localement pour optimiser le poids au format WEBP.",
    btnChooseGraphic: "Choisir un Fichier",
    btnSaveSettings: "Enregistrer les Paramètres",
    btnSavingSettings: "Application des modifications...",

    appearanceTitle: "Préférences d'Apparence de l'Interface",
    appearanceSubtitle: "Configurez instantanément l'apparence des couleurs de l'application.",
    themeSystem: "Système",
    themeLight: "Clair",
    themeDark: "Sombre",

    dangerTitle: "Zone de Danger et Suppression",
    dangerDesc: "Supprime définitivement cet espace de travail et toutes ses dépendances.",
    btnPurge: "Supprimer l'Espace de Travail",
    btnPurging: "Suppression du Shard..."
  },
  de: {
    tenantTitle: "Mandanteneigenschaften-Matrix",
    tenantSubtitle: "Ändern Sie Signaturen, automatisch komprimierte Logos und Basiswährungen.",
    tenantSuccess: "Konfigurationsmatrix erfolgreich in Supabase synchronisiert.",
    labelWorkspaceName: "Arbeitsbereichsbezeichnung",
    labelGlobalCurrency: "Globale bevorzugte Währung",
    labelLanguage: "Spracheinstellungen (Sprache)",
    labelStoreEmail: "E-Mail-Adresse des Shops",
    labelWhatsapp: "WhatsApp-Supportnummer (z. B. 6281...)",
    labelInstagram: "Instagram-Profilname",
    labelLogoTitle: "Markenlogo-Matrix (Automatische Größe)",
    labelLogoDesc: "Hochgeladene Bilder werden lokal im Canvas komprimiert, um leichte WEBP-Dateien zu erstellen.",
    btnChooseGraphic: "Grafik Wählen",
    btnSaveSettings: "Eigenschaftsmatrix Speichern",
    btnSavingSettings: "Änderungen werden übernommen...",

    appearanceTitle: "Einstellungen für das Erscheinungsbild",
    appearanceSubtitle: "Konfigurieren Sie sofort das Farbschema des Systems.",
    themeSystem: "System",
    themeLight: "Hell",
    themeDark: "Dunkel",

    dangerTitle: "Gefahrenbereich Löschen",
    dangerDesc: "Löscht den aktiven Shard und alle zugehörigen Daten unwiderruflich.",
    btnPurge: "Arbeitsbereich Löschen",
    btnPurging: "Shard wird gelöscht..."
  },
  ja: {
    tenantTitle: "テナント属性マトリックス",
    tenantSubtitle: "公開エイリアス、自動圧縮ロゴ画像、基本通貨の設定を変更します。",
    tenantSuccess: "ワークスペース設定がSupabaseに正常に同期されました。",
    labelWorkspaceName: "ワークスペース名",
    labelGlobalCurrency: "グローバル優先通貨",
    labelLanguage: "言語設定 (Language)",
    labelStoreEmail: "店舗メールアドレス",
    labelWhatsapp: "WhatsAppサポート番号 (例: 6281...)",
    labelInstagram: "Instagramユーザー名",
    labelLogoTitle: "ブランドロゴ画像 (自動リサイズ機能搭載)",
    labelLogoDesc: "アップロードされた画像はローカルバッファで自動圧縮され、最適なWEBPに変換されます。",
    btnChooseGraphic: "画像を選択",
    btnSaveSettings: "設定を保存する",
    btnSavingSettings: "設定変更を反映中...",

    appearanceTitle: "外観テーマ設定",
    appearanceSubtitle: "システム配色パラメータを即時変更します。変更内容はローカルストレージに同期されます。",
    themeSystem: "システム",
    themeLight: "ライト",
    themeDark: "ダーク",

    dangerTitle: "危険エリア (テナントの削除)",
    dangerDesc: "アクティブなシャードを永久に削除し、すべての関連データを抹消します。復元はできません。",
    btnPurge: "ワークスペースを完全に削除",
    btnPurging: "シャードを削除中..."
  },
  zh: {
    tenantTitle: "商户属性控制矩阵",
    tenantSubtitle: "修改公开别名签名、高保真自动压缩徽标以及基础货币。",
    tenantSuccess: "工作空间配置矩阵已成功同步至 Supabase 数据库中。",
    labelWorkspaceName: "工作空间/商店名称",
    labelGlobalCurrency: "全局首选货币",
    labelLanguage: "语言偏好设置 (Language)",
    labelStoreEmail: "商户联系电子邮箱",
    labelWhatsapp: "WhatsApp 客服电话 (例如: 6281...)",
    labelInstagram: "Instagram 商户用户名",
    labelLogoTitle: "品牌徽标矩阵 (客户端自动缩放容器)",
    labelLogoDesc: "上传的图片通过本地 canvas 缓存自动进行高保真 WEBP 轻量化压缩处理。",
    btnChooseGraphic: "选择图片",
    btnSaveSettings: "保存商户控制矩阵",
    btnSavingSettings: "正在应用分片变更...",

    appearanceTitle: "系统界面外观偏好",
    appearanceSubtitle: "即时配置系统颜色映射参数。选择会触发实时的持久本地存储同步。",
    themeSystem: "系统默认",
    themeLight: "明亮模式",
    themeDark: "暗黑模式",

    dangerTitle: "危险操作警示区域",
    dangerDesc: "立即销毁当前活动商户分片指针并不可逆转地删除数据库痕迹。执行前请确认备份。",
    btnPurge: "永久销毁工作空间实例",
    btnPurging: "正在销毁分片..."
  }
};

interface StoreSettingsFormProps {
  storeId: string;
  initialName: string;
  initialLogo?: string;
  initialCurrency?: string;
  initialEmail?: string;
  initialInstagram?: string;
  initialWhatsapp?: string;
  hideDangerPanel?: boolean;
}

export function StoreSettingsForm({ 
  storeId, 
  initialName, 
  initialLogo = "", 
  initialCurrency = "IDR", 
  initialEmail = "",
  initialInstagram = "",
  initialWhatsapp = "",
  hideDangerPanel = false 
}: StoreSettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client preview and storage states
  const [logoPreview, setLogoPreview] = useState(initialLogo);
  const [currency, setCurrency] = useState(initialCurrency);
  const [activeTheme, setActiveTheme] = useState("system");
  const [lang, setLang] = useState<keyof typeof translations>("id");

  useEffect(() => {
    const t = localStorage.getItem("theme") || "system";
    setActiveTheme(t);
    const savedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof translations;
    if (translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const t = translations[lang] || translations.id;

  const handleLanguageChange = (val: string) => {
    const nextLang = val as keyof typeof translations;
    setLang(nextLang);
    localStorage.setItem("dashboard-language", val);
    window.dispatchEvent(new Event("dashboard-language-changed"));
    window.location.reload();
  };

  const handleThemeChange = (themeName: string) => {
    setActiveTheme(themeName);
    localStorage.setItem("theme", themeName);
    if (themeName === "dark" || (themeName === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("logo_url", logoPreview);
    formData.set("currency", currency);

    const res = await updateStoreSettingsAction(storeId, formData);

    setIsPending(false);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
    }
  }

  async function handleDelete() {
    if (!confirm("CRITICAL WARNING: This action drops the tenant partition and cascades deletion across all bounded inventory, customer vectors, and ticket rows. Confirm drop?")) {
      return;
    }
    setIsDeleting(true);
    await deleteStoreAction(storeId);
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
    <div className="h-full flex flex-col justify-between space-y-6 font-sans">
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t.tenantTitle}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.tenantSubtitle}</p>
        </div>

        {success && (
          <div className="p-2.5 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-sm font-medium animate-bounce-once">
            {t.tenantSuccess}
          </div>
        )}

        {error && (
          <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.labelWorkspaceName}
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={initialName}
              className="w-full h-9 px-3.5 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-500" /> {t.labelGlobalCurrency}
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-9 px-3.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-500" /> {t.labelLanguage}
            </label>
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full h-9 px-3.5 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            >
              <option value="id">🇮🇩 Bahasa Indonesia</option>
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="de">🇩🇪 Deutsch</option>
              <option value="ja">🇯🇵 日本語</option>
              <option value="zh">🇨🇳 中文</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.labelStoreEmail}
            </label>
            <input
              name="email"
              type="email"
              defaultValue={initialEmail}
              className="w-full h-9 px-3.5 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.labelWhatsapp}
            </label>
            <input
              name="whatsapp"
              type="text"
              defaultValue={initialWhatsapp}
              className="w-full h-9 px-3.5 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t.labelInstagram}
            </label>
            <input
              name="instagram"
              type="text"
              defaultValue={initialInstagram}
              className="w-full h-9 px-3.5 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-800 dark:text-slate-100 focus:bg-white dark:focus:bg-[#131b2e] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-50 dark:border-slate-800">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t.labelLogoTitle}
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-sm bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-300" />
              )}
            </div>
            <div className="space-y-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-sm cursor-pointer transition-colors shadow-sm">
                <Upload className="w-3 h-3 text-slate-500" /> {t.btnChooseGraphic}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              <p className="text-[10px] text-slate-400">{t.labelLogoDesc}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {isPending ? t.btnSavingSettings : t.btnSaveSettings}
          </button>
        </div>
      </form>

      <div className="p-4 sm:p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-3 transition-colors">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Monitor className="w-4 h-4 text-indigo-500" /> {t.appearanceTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.appearanceSubtitle}</p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 dark:bg-[#0b0f19] rounded-sm border border-slate-200/80 dark:border-slate-800 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => handleThemeChange("system")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
              activeTheme === "system"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{t.themeSystem}</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
              activeTheme === "light"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>{t.themeLight}</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs transition-all cursor-pointer ${
              activeTheme === "dark"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>{t.themeDark}</span>
          </button>
        </div>
      </div>

      {!hideDangerPanel && (
        <DangerZonePanel storeId={storeId} />
      )}
    </div>
  );
}

export function DangerZonePanel({ storeId }: { storeId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [lang, setLang] = useState<keyof typeof translations>("id");

  useEffect(() => {
    const savedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof translations;
    if (translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const t = translations[lang] || translations.id;

  async function handleDelete() {
    if (!confirm("CRITICAL WARNING: This action drops the tenant partition and cascades deletion across all bounded inventory, customer vectors, and ticket rows. Confirm drop?")) {
      return;
    }
    setIsDeleting(true);
    await deleteStoreAction(storeId);
  }

  return (
    <div className="p-4 sm:p-6 bg-red-50/50 dark:bg-red-950/20 rounded-sm border border-red-100 dark:border-red-900/40 space-y-3 transition-colors">
      <div className="flex items-center gap-2">
        <AlertOctagon className="w-4 h-4 text-red-600" />
        <h3 className="text-xs font-bold text-red-950 dark:text-red-400 uppercase tracking-wider">
          {t.dangerTitle}
        </h3>
      </div>
      <p className="text-xs text-red-800/80 dark:text-red-300/80 leading-relaxed max-w-2xl">
        {t.dangerDesc}
      </p>
      <div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-sm shadow-sm transition-all cursor-pointer"
        >
          {isDeleting ? t.btnPurging : t.btnPurge}
        </button>
      </div>
    </div>
  );
}
