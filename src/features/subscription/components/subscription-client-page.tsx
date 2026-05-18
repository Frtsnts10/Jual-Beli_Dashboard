"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, ShieldCheck, Check, Zap, CheckCircle2 } from "lucide-react";
import { createCheckoutSessionAction } from "../server/subscription-actions";

interface SubscriptionClientPageProps {
  storeId: string;
  isPaymentSuccess: boolean;
  isSubscribed: boolean;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  currency: string;
}

const translations = {
  id: {
    title: "Manajemen Tagihan & Kuota",
    description: "Tinjau batas kuota database saat ini dan aktifkan jalur telemetri tingkat premium.",
    paymentSuccessTitle: "Transaksi Pembayaran Berhasil Diotorisasi!",
    paymentSuccessDesc: "Jabat tangan simulasi telah mengaktifkan batas PCI-DSS standar. Status paket diperbarui menjadi Shop Dashboard Pro di seluruh klaster persisten.",
    statusTitle: "Status Telemetri Paket",
    statusActive: "Aktif",
    statusInactive: "Tidak Aktif",
    matrixLevel: "Tingkat Matriks",
    activeVector: "Vektor Tagihan Aktif: Seumur Hidup (Akses Tanpa Batas)",
    billingEnd: "Tanggal berakhir tagihan aktif: ",
    slaTelemetry: "Telemetri Aktif SLA",
    slaDesc: "Kait PostgreSQL tersinkronisasi",
    provisionTitle: "Skala Sumber Daya Penyediaan",
    provisionDesc: "Tingkatkan shard aktif Anda untuk melewati batas API secara instan",
    
    monthly: "Bulanan",
    yearly: "Tahunan",
    lifetime: "Seumur Hidup",
    save30: "Hemat 30%",
    bestValue: "Nilai Terbaik",
    
    baseTier: "Tingkat Dasar",
    defaultActive: "Aktif Default",
    standardCoreTitle: "Core Standar",
    standardCoreDesc: "Pengaturan pencatatan data penting untuk ruang kerja bukti konsep sederhana.",
    monthForever: " / bulan selamanya",
    freeFeatures: [
      "Hingga 3 Toko Shard Aktif",
      "Aliran penyerapan SKU dasar",
      "Kisi telemetri tingkat lanjut (terkunci)",
      "Sinkronisasi Live Stripe SLA (terkunci)"
    ],
    activeCoreBound: "Batas Core Aktif",
    includedInPackage: "Termasuk dalam paket Anda",
    
    premiumEnterprise: "Perusahaan Premium",
    proTitle: "Shop Dashboard Pro",
    proDesc: "Vektor skala tak terbatas yang mendukung operasi batas langsung multi-penyewa absolut.",
    workspaceMonth: " / bulan ruang kerja",
    workspaceYear: " / tahun ruang kerja",
    oneTimeLifetime: " / seumur hidup sekali bayar",
    ctaMonthly: "Tingkatkan Shard Bulanan",
    ctaYearly: "Tingkatkan Shard Tahunan",
    ctaLifetime: "Dapatkan Akses Seumur Hidup",
    proFeatures: {
      monthly: [
        "Toko Shard Tanpa Batas",
        "Kisi telemetri @tanstack/react-table canggih",
        "Pengikatan otomatis Stripe SLA instan",
        "Tindakan siklus SLA Meja Pelanggan Prioritas"
      ],
      yearly: [
        "Toko Shard Tanpa Batas",
        "Kisi telemetri @tanstack/react-table canggih",
        "Pengikatan otomatis Stripe SLA instan",
        "Tindakan siklus SLA Meja Pelanggan Prioritas",
        "Susunan webhook pengembang khusus prioritas",
        "Sinkronisasi audit kepatuhan PCI-DSS tahunan"
      ],
      lifetime: [
        "Toko Shard Tanpa Batas",
        "Kisi telemetri @tanstack/react-table canggih",
        "Pengikatan otomatis Stripe SLA instan",
        "Tindakan siklus SLA Meja Pelanggan Prioritas",
        "Lisensi seumur hidup - Miliki selamanya",
        "Tanpa biaya langganan berulang",
        "Semua pembaruan premium masa depan disertakan"
      ]
    },
    connecting: "Menghubungkan Vektor Aman...",
    simulateStripe: "Simulasikan Stripe Gateway"
  },
  en: {
    title: "Billing & Quota Management",
    description: "Review current database quota bounds and trigger premium tier telemetry paths.",
    paymentSuccessTitle: "Payment Transaction Authorized Successfully!",
    paymentSuccessDesc: "Simulated handshakes have activated standard PCI-DSS boundaries. Plan status updated to Shop Dashboard Pro across persistent clusters.",
    statusTitle: "Plan Telemetry Status",
    statusActive: "Active",
    statusInactive: "Inactive",
    matrixLevel: "Matrix Level",
    activeVector: "Active Billing Vector: Lifetime (Infinite Access)",
    billingEnd: "Billing active vector end string: ",
    slaTelemetry: "SLA Active Telemetry",
    slaDesc: "PostgreSQL hooks synchronized",
    provisionTitle: "Provision Resource Scales",
    provisionDesc: "Upgrade your active shard to bypass API limits instantly",
    
    monthly: "Monthly",
    yearly: "Yearly",
    lifetime: "Lifetime",
    save30: "Save 30%",
    bestValue: "Best Value",
    
    baseTier: "Base Tier",
    defaultActive: "Default Active",
    standardCoreTitle: "Standard Core",
    standardCoreDesc: "Essential data logging setup for simple proof-of-concept workspaces.",
    monthForever: " / month forever",
    freeFeatures: [
      "Up to 3 Active Store Shards",
      "Basic SKU ingestion stream",
      "Advanced telemetry grids (locked)",
      "Live Stripe SLA Syncing (locked)"
    ],
    activeCoreBound: "Active Core Bound",
    includedInPackage: "Included in your package",
    
    premiumEnterprise: "Premium Enterprise",
    proTitle: "Shop Dashboard Pro",
    proDesc: "Unlimited scale vectors supporting absolute multitenant live boundary operations.",
    workspaceMonth: " / workspace month",
    workspaceYear: " / workspace year",
    oneTimeLifetime: " / one-time lifetime",
    ctaMonthly: "Upgrade Monthly Shard",
    ctaYearly: "Upgrade Yearly Shard",
    ctaLifetime: "Acquire Lifetime Access",
    proFeatures: {
      monthly: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions"
      ],
      yearly: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions",
        "Priority dedicated developer webhook arrays",
        "Annual PCI-DSS compliance audits sync"
      ],
      lifetime: [
        "Unlimited Store Shards",
        "Advanced @tanstack/react-table telemetry grids",
        "Instant Stripe SLA automatic bindings",
        "Priority Customer Desk SLA cycle actions",
        "Lifetime license - Own it forever",
        "Zero recurring subscription costs",
        "All future premium updates included"
      ]
    },
    connecting: "Connecting Secure Vector...",
    simulateStripe: "Simulate Stripe Gateway"
  },
  es: {
    title: "Gestión de Facturación y Cuotas",
    description: "Revise los límites de cuota de la base de datos y active rutas de telemetría premium.",
    paymentSuccessTitle: "¡Pago Autorizado Exitosamente!",
    paymentSuccessDesc: "Las transacciones simuladas han activado los límites estándar de PCI-DSS. El estado se actualizó a Shop Dashboard Pro.",
    statusTitle: "Estado de Telemetría del Plan",
    statusActive: "Activo",
    statusInactive: "Inactivo",
    matrixLevel: "Nivel de Matriz",
    activeVector: "Vector de facturación activo: De por vida (Acceso infinito)",
    billingEnd: "Finalización del vector de facturación: ",
    slaTelemetry: "Telemetría Activa SLA",
    slaDesc: "Ganchos de PostgreSQL sincronizados",
    provisionTitle: "Escalas de Aprovisionamiento de Recursos",
    provisionDesc: "Mejore su shard para omitir los límites de API instantáneamente",
    
    monthly: "Mensual",
    yearly: "Anual",
    lifetime: "De por vida",
    save30: "Ahorra 30%",
    bestValue: "Mejor Valor",
    
    baseTier: "Nivel Base",
    defaultActive: "Activo por Defecto",
    standardCoreTitle: "Núcleo Estándar",
    standardCoreDesc: "Configuración esencial de registro de datos para entornos de prueba básicos.",
    monthForever: " / mes para siempre",
    freeFeatures: [
      "Hasta 3 fragmentos de tienda activos",
      "Flujo de ingesta básico de SKU",
      "Rejillas de telemetría avanzadas (bloqueadas)",
      "Sincronización Live Stripe SLA (bloqueada)"
    ],
    activeCoreBound: "Límite de Núcleo Activo",
    includedInPackage: "Incluido en su paquete",
    
    premiumEnterprise: "Premium Corporativo",
    proTitle: "Shop Dashboard Pro",
    proDesc: "Vectores a escala ilimitados que soportan operaciones en vivo multi-inquilino absolutas.",
    workspaceMonth: " / mes de espacio de trabajo",
    workspaceYear: " / año de espacio de trabajo",
    oneTimeLifetime: " / pago único de por vida",
    ctaMonthly: "Mejorar Shard Mensual",
    ctaYearly: "Mejorar Shard Anual",
    ctaLifetime: "Obtener Acceso de Por Vida",
    proFeatures: {
      monthly: [
        "Fragmentos de Tienda Ilimitados",
        "Telemetría avanzada de @tanstack/react-table",
        "Integración automática de Stripe SLA",
        "Soporte prioritario de atención al cliente"
      ],
      yearly: [
        "Fragmentos de Tienda Ilimitados",
        "Telemetría avanzada de @tanstack/react-table",
        "Integración automática de Stripe SLA",
        "Soporte prioritario de atención al cliente",
        "Arreglo prioritario de webhooks de desarrollo",
        "Auditoría anual de cumplimiento PCI-DSS"
      ],
      lifetime: [
        "Fragmentos de Tienda Ilimitados",
        "Telemetría avanzada de @tanstack/react-table",
        "Integración automática de Stripe SLA",
        "Soporte prioritario de atención al cliente",
        "Licencia de por vida - Propia para siempre",
        "Sin cargos recurrentes adicionales",
        "Todas las futuras actualizaciones premium"
      ]
    },
    connecting: "Conectando Vector Seguro...",
    simulateStripe: "Simular Stripe Gateway"
  },
  fr: {
    title: "Gestion de Facturation & Quotas",
    description: "Consultez les limites de quotas et déclenchez la télémétrie premium.",
    paymentSuccessTitle: "Paiement Autorisé avec Succès !",
    paymentSuccessDesc: "Les simulations ont activé les limites standard PCI-DSS. Le plan a été mis à niveau vers Shop Dashboard Pro.",
    statusTitle: "Statut Télémétrique du Plan",
    statusActive: "Actif",
    statusInactive: "Inactif",
    matrixLevel: "Niveau de la Matrice",
    activeVector: "Vecteur de facturation actif : À vie (Accès illimité)",
    billingEnd: "Fin du vecteur de facturation : ",
    slaTelemetry: "Télémétrie SLA Active",
    slaDesc: "Crochets PostgreSQL synchronisés",
    provisionTitle: "Provisionnement de Ressources",
    provisionDesc: "Améliorez votre shard actif pour contourner instantanément les limites API",
    
    monthly: "Mensuel",
    yearly: "Annuel",
    lifetime: "À vie",
    save30: "Économisez 30%",
    bestValue: "Meilleure Offre",
    
    baseTier: "Offre de Base",
    defaultActive: "Actif par Défaut",
    standardCoreTitle: "Noyau Standard",
    standardCoreDesc: "Configuration essentielle pour l'enregistrement de données simples.",
    monthForever: " / mois pour toujours",
    freeFeatures: [
      "Jusqu'à 3 fragments de boutique actifs",
      "Flux d'intégration SKU de base",
      "Grilles de télémétrie avancées (verrouillées)",
      "Synchronisation Live Stripe SLA (verrouillée)"
    ],
    activeCoreBound: "Noyau Actif Restreint",
    includedInPackage: "Inclus dans votre offre",
    
    premiumEnterprise: "Premium Entreprise",
    proTitle: "Shop Dashboard Pro",
    proDesc: "Vecteurs d'échelle illimités pour soutenir les opérations multi-locataires.",
    workspaceMonth: " / mois par espace",
    workspaceYear: " / an par espace",
    oneTimeLifetime: " / paiement unique à vie",
    ctaMonthly: "Améliorer Shard Mensuel",
    ctaYearly: "Améliorer Shard Annuel",
    ctaLifetime: "Obtenir l'Accès à Vie",
    proFeatures: {
      monthly: [
        "Boutiques Shards Illimitées",
        "Télémétrie @tanstack/react-table avancée",
        "Liaison Stripe SLA automatique instantanée",
        "Support client prioritaires SLA"
      ],
      yearly: [
        "Boutiques Shards Illimitées",
        "Télémétrie @tanstack/react-table avancée",
        "Liaison Stripe SLA automatique instantanée",
        "Support client prioritaires SLA",
        "Webhooks développeurs dédiés prioritaires",
        "Audits annuels de conformité PCI-DSS"
      ],
      lifetime: [
        "Boutiques Shards Illimitées",
        "Télémétrie @tanstack/react-table avancée",
        "Liaison Stripe SLA automatique instantanée",
        "Support client prioritaires SLA",
        "Licence à vie - Possédez-la pour toujours",
        "Aucun coût d'abonnement récurrent",
        "Toutes les mises à jour premium incluses"
      ]
    },
    connecting: "Connexion au Vecteur Sécurisé...",
    simulateStripe: "Simuler Stripe Gateway"
  },
  de: {
    title: "Abrechnung & Kontingentverwaltung",
    description: "Überprüfen Sie die Kontingente und aktivieren Sie die Premium-Telemetrie.",
    paymentSuccessTitle: "Zahlung erfolgreich autorisiert!",
    paymentSuccessDesc: "Die simulierte Zahlung hat die standardmäßigen PCI-DSS-Grenzen aktiviert. Status auf Shop Dashboard Pro aktualisiert.",
    statusTitle: "Plan-Telemetriestatus",
    statusActive: "Aktiv",
    statusInactive: "Inaktiv",
    matrixLevel: "Matrix-Ebene",
    activeVector: "Aktiver Abrechnungsvektor: Lebenslang (Unbegrenzter Zugriff)",
    billingEnd: "Ende des Abrechnungszeitraums: ",
    slaTelemetry: "SLA Aktive Telemetrie",
    slaDesc: "PostgreSQL-Hooks synchronisiert",
    provisionTitle: "Ressourcenskalierung bereitstellen",
    provisionDesc: "Aktualisieren Sie Ihren Shard, um API-Limits sofort zu umgehen",
    
    monthly: "Monatlich",
    yearly: "Jährlich",
    lifetime: "Lebenslang",
    save30: "Sparen Sie 30%",
    bestValue: "Bester Wert",
    
    baseTier: "Basis-Stufe",
    defaultActive: "Standardmäßig Aktiv",
    standardCoreTitle: "Standard-Kern",
    standardCoreDesc: "Grundlegende Datenprotokollierung für einfache Konzepterprobungen.",
    monthForever: " / Monat für immer",
    freeFeatures: [
      "Bis zu 3 aktive Store-Shards",
      "Basis-SKU-Aufnahmestrom",
      "Erweiterte Telemetriegitter (gesperrt)",
      "Live Stripe SLA-Synchronisierung (gesperrt)"
    ],
    activeCoreBound: "Aktive Kernbindung",
    includedInPackage: "In Ihrem Paket enthalten",
    
    premiumEnterprise: "Premium Unternehmen",
    proTitle: "Shop Dashboard Pro",
    proDesc: "Unbegrenzte Skalierungsvektoren für absolute Multi-Mandanten-Live-Vorgänge.",
    workspaceMonth: " / Workspace Monat",
    workspaceYear: " / Workspace Jahr",
    oneTimeLifetime: " / Einmalig Lebenslang",
    ctaMonthly: "Monatliches Shard Upgrade",
    ctaYearly: "Jährliches Shard Upgrade",
    ctaLifetime: "Lebenslangen Zugriff erwerben",
    proFeatures: {
      monthly: [
        "Unbegrenzte Store-Shards",
        "Fortgeschrittene @tanstack/react-table Telemetrie",
        "Sofortige automatische Stripe SLA-Anbindung",
        "Priorisierter Kundensupport-Schreibtisch"
      ],
      yearly: [
        "Unbegrenzte Store-Shards",
        "Fortgeschrittene @tanstack/react-table Telemetrie",
        "Sofortige automatische Stripe SLA-Anbindung",
        "Priorisierter Kundensupport-Schreibtisch",
        "Priorisierte Entwickler-Webhook-Arrays",
        "Jährliche PCI-DSS-Compliance-Audits"
      ],
      lifetime: [
        "Unbegrenzte Store-Shards",
        "Fortgeschrittene @tanstack/react-table Telemetrie",
        "Sofortige automatische Stripe SLA-Anbindung",
        "Priorisierter Kundensupport-Schreibtisch",
        "Lebenslange Lizenz - Für immer besitzen",
        "Keine wiederkehrenden Abonnementkosten",
        "Alle zukünftigen Premium-Updates inklusive"
      ]
    },
    connecting: "Verbindung zum Sicherheitsvektor...",
    simulateStripe: "Stripe Gateway simulieren"
  },
  ja: {
    title: "請求と制限管理",
    description: "現在のデータベース制限を確認し、プレミアムテレメトリを有効にします。",
    paymentSuccessTitle: "決済承認が正常に完了しました！",
    paymentSuccessDesc: "シミュレーション決済によりPCI-DSS規格が有効化されました。プランはShop Dashboard Proに正常更新されました。",
    statusTitle: "プランテレメトリステータス",
    statusActive: "アクティブ",
    statusInactive: "非アクティブ",
    matrixLevel: "マトリックスレベル",
    activeVector: "請求ステータス: ライフタイム（無制限アクセス）",
    billingEnd: "次回更新日: ",
    slaTelemetry: "SLA アクティブテレメトリ",
    slaDesc: "PostgreSQLフックが同期されました",
    provisionTitle: "リソーススケールの提供",
    provisionDesc: "API制限を即座に解除するためにアクティブなシャードをアップグレード",
    
    monthly: "月払い",
    yearly: "年払い",
    lifetime: "ライフタイム",
    save30: "30%割引",
    bestValue: "最高値",
    
    baseTier: "基本プラン",
    defaultActive: "標準で有効",
    standardCoreTitle: "標準コア",
    standardCoreDesc: "シンプルな検証用ワークスペースに必要な基本ログ機能。",
    monthForever: " / 永久無料",
    freeFeatures: [
      "最大3つのアクティブストアシャード",
      "基本的なSKUインジェストストリーム",
      "高度なテレメトリグリッド（ロック中）",
      "Live Stripe SLA同期（ロック中）"
    ],
    activeCoreBound: "標準プランバインド中",
    includedInPackage: "パッケージに含まれています",
    
    premiumEnterprise: "プレミアムエンタープライズ",
    proTitle: "Shop Dashboard Pro",
    proDesc: "完全なマルチテナント運用をサポートする無限スケール。",
    workspaceMonth: " / ワークスペース・月",
    workspaceYear: " / ワークスペース・年",
    oneTimeLifetime: " / ライフタイム一括払い",
    ctaMonthly: "月間シャードアップグレード",
    ctaYearly: "年間シャードアップグレード",
    ctaLifetime: "永続ライセンスの購入",
    proFeatures: {
      monthly: [
        "無制限のストアシャード数",
        "高度な @tanstack/react-table グリッド機能",
        "即座の Stripe SLA 自動連携",
        "優先サポートデスク対応"
      ],
      yearly: [
        "無制限のストアシャード数",
        "高度な @tanstack/react-table グリッド機能",
        "即座の Stripe SLA 自動連携",
        "優先サポートデスク対応",
        "開発者向け優先Webhook配列",
        "年次 PCI-DSS コンプライアンス監査"
      ],
      lifetime: [
        "無制限のストアシャード数",
        "高度な @tanstack/react-table グリッド機能",
        "即座の Stripe SLA 自動連携",
        "優先サポートデスク対応",
        "無期限ライセンス - 永久所有",
        "月額サブスク費用ゼロ",
        "将来のすべてのプレミアム機能更新に対応"
      ]
    },
    connecting: "セキュリティベクターに接続中...",
    simulateStripe: "Stripeゲートウェイのシミュレーション"
  },
  zh: {
    title: "账单与配额管理",
    description: "查看当前数据库配额界限并触发高级遥测路径。",
    paymentSuccessTitle: "支付授权成功！",
    paymentSuccessDesc: "模拟支付已激活标准 PCI-DSS 边界。服务方案已升级为 Shop Dashboard Pro。",
    statusTitle: "方案遥测状态",
    statusActive: "已激活",
    statusInactive: "未激活",
    matrixLevel: "矩阵级别",
    activeVector: "当前计费模式: 终身无限访问",
    billingEnd: "计费周期截止时间: ",
    slaTelemetry: "SLA 实时遥测",
    slaDesc: "PostgreSQL 钩子已同步",
    provisionTitle: "资源规模分配",
    provisionDesc: "立即升级您的活动分片以跳过 API 流量限制",
    
    monthly: "按月计费",
    yearly: "按年计费",
    lifetime: "终身版",
    save30: "节省 30%",
    bestValue: "最佳性价比",
    
    baseTier: "基础层",
    defaultActive: "默认激活",
    standardCoreTitle: "标准核心",
    standardCoreDesc: "简单概念验证空间的基本数据记录设置。",
    monthForever: " / 每月永久免费",
    freeFeatures: [
      "最多 3 个活动商店分片",
      "基本 SKU 摄入流",
      "高级遥测网格（已锁定）",
      "实时 Stripe SLA 同步（已锁定）"
    ],
    activeCoreBound: "标准核心绑定",
    includedInPackage: "已包含在您的方案中",
    
    premiumEnterprise: "企业专业版",
    proTitle: "Shop Dashboard Pro",
    proDesc: "支持多租户实时业务运转的无限扩容方案。",
    workspaceMonth: " / 空间·月",
    workspaceYear: " / 空间·年",
    oneTimeLifetime: " / 终身一次性付清",
    ctaMonthly: "升级月度分片",
    ctaYearly: "升级年度分片",
    ctaLifetime: "获得终身访问权限",
    proFeatures: {
      monthly: [
        "无限制的商店分片",
        "高级 @tanstack/react-table 遥测网格",
        "即时 Stripe SLA 自动绑定",
        "优先客户服务 SLA 响应"
      ],
      yearly: [
        "无限制的商店分片",
        "高级 @tanstack/react-table 遥测网格",
        "即时 Stripe SLA 自动绑定",
        "优先客户服务 SLA 响应",
        "优先专用开发者 Webhook 数组",
        "年度 PCI-DSS 合规性审计"
      ],
      lifetime: [
        "无限制的商店分片",
        "高级 @tanstack/react-table 遥测网格",
        "即时 Stripe SLA 自动绑定",
        "优先客户服务 SLA 响应",
        "终身版授权 - 永久拥有",
        "无后续重复扣费成本",
        "包含所有未来的高级更新"
      ]
    },
    connecting: "正在连接安全通道...",
    simulateStripe: "模拟 Stripe 支付网关"
  }
};

export function SubscriptionClientPage({
  storeId,
  isPaymentSuccess,
  isSubscribed,
  plan,
  status,
  currentPeriodEnd,
  currency
}: SubscriptionClientPageProps) {
  const [lang, setLang] = useState<keyof typeof translations>("id");
  const [isPending, setIsPending] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly" | "lifetime">("monthly");

  // Load language settings dynamically from localStorage on client mount
  useEffect(() => {
    const savedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof translations;
    if (translations[savedLang]) {
      setLang(savedLang);
    }

    const handleLangChange = () => {
      const updatedLang = (localStorage.getItem("dashboard-language") || "id") as keyof typeof translations;
      if (translations[updatedLang]) {
        setLang(updatedLang);
      }
    };

    window.addEventListener("dashboard-language-changed", handleLangChange);
    return () => {
      window.removeEventListener("dashboard-language-changed", handleLangChange);
    };
  }, []);

  const t = translations[lang] || translations.id;

  const handleUpgrade = async () => {
    setIsPending(true);
    const returnUrl = typeof window !== "undefined" ? window.location.href : "";
    const res = await createCheckoutSessionAction(storeId, returnUrl, billingInterval);
    if (res?.url) {
      window.location.href = res.url;
    } else {
      alert("Failed to provision routing session. Ensure STRIPE keys are bound.");
      setIsPending(false);
    }
  };

  const formatPrice = (usdAmount: number) => {
    if (currency.toUpperCase() === "IDR") {
      const amount = usdAmount * 15000;
      return new Intl.NumberFormat("id-ID", { 
        style: "currency", 
        currency: "IDR", 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(usdAmount);
  };

  const pricingData = {
    monthly: {
      price: formatPrice(29),
      suffix: t.workspaceMonth,
      cta: t.ctaMonthly,
      badge: "Standard Premium",
      features: t.proFeatures.monthly
    },
    yearly: {
      price: formatPrice(59),
      suffix: t.workspaceYear,
      cta: t.ctaYearly,
      badge: "Premium Saver",
      features: t.proFeatures.yearly
    },
    lifetime: {
      price: formatPrice(99),
      suffix: t.oneTimeLifetime,
      cta: t.ctaLifetime,
      badge: "Best Value",
      features: t.proFeatures.lifetime
    }
  };

  const currentPricing = pricingData[billingInterval];

  return (
    <div className="space-y-8 font-sans pb-12 animate-in fade-in duration-300">
      {/* Page Header (No local switcher - clean settings bind) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>
        </div>
      </div>

      {isPaymentSuccess && (
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-start sm:items-center gap-3 text-emerald-800 dark:text-emerald-300 shadow-sm animate-bounce-once">
          <div className="p-2 bg-emerald-500 text-white rounded-sm shrink-0 mt-0.5 sm:mt-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {t.paymentSuccessTitle}
            </p>
            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
              {t.paymentSuccessDesc}
            </p>
          </div>
        </div>
      )}

      {/* Localized Status Panel */}
      <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.statusTitle}</span>
            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide transition-colors ${
              isSubscribed ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {status === "active" ? t.statusActive : status === "inactive" ? t.statusInactive : status}
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize flex items-center gap-2">
            {plan === "free" ? t.standardCoreTitle : plan === "Shop Dashboard Pro (Monthly)" || plan === "Shop Dashboard Pro (Yearly)" || plan === "Shop Dashboard Pro (Lifetime)" || plan === "Shop Dashboard Pro" ? t.proTitle : plan} {t.matrixLevel}
            {isSubscribed && <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
          </h3>
          {currentPeriodEnd ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.billingEnd} <span className="font-mono font-medium">{new Date(currentPeriodEnd).toLocaleDateString()}</span>
            </p>
          ) : isSubscribed ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.activeVector}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-indigo-50 dark:from-indigo-950/40 to-violet-50 dark:to-violet-950/20 text-indigo-600 dark:text-indigo-400 rounded-sm border border-indigo-100/40 dark:border-indigo-900/40 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.slaTelemetry}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{t.slaDesc}</p>
          </div>
        </div>
      </div>

      {/* Pricing and interval selector section */}
      <div className="pt-4">
        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t.provisionTitle}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.provisionDesc}</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Dynamic Pills Interval Selector Toggle */}
          <div className="flex justify-center mb-10">
            <div className="bg-slate-100 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 p-1 rounded-sm flex gap-1 shadow-sm relative transition-all">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all cursor-pointer ${
                  billingInterval === "monthly"
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.monthly}
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all relative cursor-pointer ${
                  billingInterval === "yearly"
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.yearly}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm shadow-md animate-pulse">
                  {t.save30}
                </span>
              </button>
              <button
                onClick={() => setBillingInterval("lifetime")}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-wider rounded-sm transition-all relative cursor-pointer ${
                  billingInterval === "lifetime"
                    ? "bg-indigo-600 text-white shadow-sm scale-102"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {t.lifetime}
                <span className="absolute -top-3.5 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[7px] font-black uppercase px-1.5 py-0.5 rounded-sm shadow-md animate-pulse">
                  {t.bestValue}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free tier card */}
            <div className="p-6 bg-white dark:bg-[#0d1322] rounded-sm border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between opacity-90 relative transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.baseTier}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-sm font-bold transition-colors">
                    {t.defaultActive}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{t.standardCoreTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  {t.standardCoreDesc}
                </p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-slate-100">{formatPrice(0)}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold">{t.monthForever}</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {t.freeFeatures.map((feature, i) => (
                    <li key={i} className={`flex items-center gap-2.5 ${i >= 2 ? "text-slate-300 dark:text-slate-700 line-through" : ""}`}>
                      <Check className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <button
                  disabled
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-sm text-center transition-colors"
                >
                  {isSubscribed ? t.includedInPackage : t.activeCoreBound}
                </button>
              </div>
            </div>

            {/* Pro tier card */}
            <div className="p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-sm border border-indigo-500/30 shadow-2xl flex flex-col justify-between relative overflow-hidden text-white transition-colors">
              {/* Glow orb */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> {t.premiumEnterprise}
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-0.5 rounded-sm font-bold">
                    {currentPricing.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{t.proTitle}</h3>
                <p className="text-xs text-indigo-200/70 mb-6 leading-relaxed">
                  {t.proDesc}
                </p>
                <div className="mb-6 animate-in fade-in zoom-in-95 duration-200">
                  <span className="text-4xl font-black text-white">{currentPricing.price}</span>
                  <span className="text-xs text-indigo-300/80 font-bold">{currentPricing.suffix}</span>
                </div>
                <ul className="space-y-3 text-xs text-indigo-100/90 font-medium">
                  {currentPricing.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 40}ms` }}>
                      <Zap className="w-4 h-4 text-indigo-400 shrink-0 fill-indigo-400 animate-pulse" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-white/10 relative z-10">
                <button
                  onClick={handleUpgrade}
                  disabled={isPending}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 active:scale-95 text-white text-xs font-bold rounded-sm text-center shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? t.connecting : isSubscribed ? t.simulateStripe : currentPricing.cta}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
