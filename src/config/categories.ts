export interface CategoryMapping {
  categoryName: string;
  products: string[];
}

export const INVENTORY_CATEGORIES: CategoryMapping[] = [
  {
    categoryName: "Streaming & Entertainment",
    products: [
      "Netflix", "Spotify", "YouTube Premium", "Disney+", 
      "HBO Max", "Prime Video", "Hulu", "Crunchyroll", 
      "Apple TV+", "Apple Music", "Tidal", "Viu", "Paramount+",
      "Peacock Premium", "iQIYI", "WeTV", "YouTube Music Premium"
    ],
  },
  {
    categoryName: "Design & Creative",
    products: [
      "Canva Pro", "CapCut Pro", "Adobe Creative Cloud", 
      "Figma Pro", "Envato Elements", "Freepik Premium", 
      "Picsart Gold", "Lightroom", "VSCO Pro", "Flaticon"
    ],
  },
  {
    categoryName: "AI & Productivity",
    products: [
      "ChatGPT Plus", "Claude Pro", "Midjourney", 
      "Microsoft 365", "Google Workspace", "Grammarly Premium", 
      "Notion AI", "Zoom Pro", "Perplexity Pro"
    ],
  },
  {
    categoryName: "VPN & Security",
    products: [
      "NordVPN", "ExpressVPN", "Surfshark", "CyberGhost", 
      "Kaspersky", "Bitdefender", "McAfee"
    ],
  },
  {
    categoryName: "Gaming & Vouchers",
    products: [
      "Discord Nitro", "Xbox Game Pass", "PlayStation Plus", "Nintendo Switch Online", 
      "Steam Wallet", "Valorant Points", "Mobile Legends Diamonds", 
      "PUBG UC", "Roblox Robux", "Free Fire Diamonds", "Genshin Impact Genesis Crystals",
      "Nintendo eShop Cards"
    ],
  },
  {
    categoryName: "Software & OS",
    products: [
      "Windows 11 Pro", "Windows 10 Pro", "Microsoft Office 2021", 
      "IDM (Internet Download Manager)"
    ],
  },
  {
    categoryName: "Cloud & Storage",
    products: [
      "Google One", "iCloud+", "OneDrive", "Dropbox Plus"
    ],
  },
  {
    categoryName: "Education & Learning",
    products: [
      "Duolingo Super", "Coursera Plus", "Udemy", "Skillshare", "Quizlet Plus"
    ],
  },
  {
    categoryName: "Other",
    products: ["Miscellaneous"],
  },
];

export function getProductsForCategory(categoryName: string): string[] {
  const mapping = INVENTORY_CATEGORIES.find(
    (c) => c.categoryName.toLowerCase() === categoryName.toLowerCase()
  );
  return mapping ? mapping.products : [];
}

export const ALL_CATEGORIES = INVENTORY_CATEGORIES.map((c) => c.categoryName);
