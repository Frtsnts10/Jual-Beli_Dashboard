export interface ProductTierConfig {
  defaultTier: string;
  options: string[];
}

/**
 * Centrally editable mapping registry defining specific tier structures for each asset brand.
 * You can safely modify, delete, or add brands below to instantly configure UI datalists.
 */
export const PRODUCT_TIERS_REGISTRY: Record<string, ProductTierConfig> = {
  netflix: {
    defaultTier: "1user",
    options: ["1user", "2user", "semi private", "private"],
  },
  youtube: {
    defaultTier: "family member",
    options: ["family member", "individual slot", "private upgrade"],
  },
  spotify: {
    defaultTier: "family invite",
    options: ["family invite", "duo plan", "individual"],
  },
  canva: {
    defaultTier: "team member",
    options: ["team member", "admin access", "pro invite"],
  },
  crunchyroll: {
    defaultTier: "mega fan slot",
    options: ["mega fan slot", "ultimate tier", "private line"],
  },
  disney: {
    defaultTier: "profile slot",
    options: ["profile slot", "premium shared", "private account"],
  },
  hbo: {
    defaultTier: "profile slot",
    options: ["profile slot", "ad free slot", "private account"],
  },
  max: {
    defaultTier: "profile slot",
    options: ["profile slot", "ad free slot", "private account"],
  },
  prime: {
    defaultTier: "profile slot",
    options: ["profile slot", "video only slot", "private account"],
  },
  hulu: {
    defaultTier: "profile slot",
    options: ["profile slot", "no ads slot", "live tv shared"],
  },
  apple: {
    defaultTier: "family member",
    options: ["family member", "individual account", "premier tier"],
  },
  chatgpt: {
    defaultTier: "plus shared",
    options: ["plus shared", "plus private", "team member"],
  },
  openai: {
    defaultTier: "plus shared",
    options: ["plus shared", "plus private", "team member"],
  },
  grammarly: {
    defaultTier: "premium shared",
    options: ["premium shared", "premium private", "business slot"],
  },
  nordvpn: {
    defaultTier: "device slot",
    options: ["device slot", "private account"],
  },
  expressvpn: {
    defaultTier: "device slot",
    options: ["device slot", "private account"],
  },
  surfshark: {
    defaultTier: "device slot",
    options: ["device slot", "private account"],
  },
  microsoft: {
    defaultTier: "family slot",
    options: ["family slot", "personal account", "business basic"],
  },
  office: {
    defaultTier: "family slot",
    options: ["family slot", "personal account", "business basic"],
  },
  google: {
    defaultTier: "family member",
    options: ["family member", "individual slot"],
  },
  capcut: {
    defaultTier: "pro shared",
    options: ["pro shared", "pro private"],
  },
  zoom: {
    defaultTier: "pro shared",
    options: ["pro shared", "pro private", "business slot"],
  },
};

export const UNIVERSAL_FALLBACK_TIERS: ProductTierConfig = {
  defaultTier: "1user",
  options: ["1user", "2user", "semi private", "private", "standard", "custom"],
};

/**
 * Intelligently extracts matching configuration options using broad keyword presence.
 */
export function getTierConfigForProduct(productName: string): ProductTierConfig {
  if (!productName) return UNIVERSAL_FALLBACK_TIERS;
  const normalized = productName.toLowerCase().trim();

  for (const [key, config] of Object.entries(PRODUCT_TIERS_REGISTRY)) {
    if (normalized.includes(key)) {
      return config;
    }
  }

  return UNIVERSAL_FALLBACK_TIERS;
}

/**
 * Formats a raw tier ID into a beautiful, human-readable display name.
 * Example: "1user" -> "1 User", "semi private" -> "Semi Private"
 */
export function formatTierName(tier: string): string {
  if (!tier) return "";
  return tier
    .replace(/(\d+)user/ig, '$1 User')
    .split(/[\s_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
