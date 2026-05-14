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
