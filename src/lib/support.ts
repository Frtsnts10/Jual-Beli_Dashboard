/** Shared by the seller "Bantuan" pages and the admin inbox. */
export const TICKET_CATEGORIES = [
  { key: "bug", label: "Bug / error" },
  { key: "payment", label: "Pembayaran / paket" },
  { key: "question", label: "Pertanyaan" },
  { key: "other", label: "Lainnya" },
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number]["key"];

export const TICKET_STATUS = {
  NEW: { label: "Baru", variant: "warning" },
  IN_PROGRESS: { label: "Diproses", variant: "default" },
  RESOLVED: { label: "Selesai", variant: "success" },
} as const;
export type TicketStatus = keyof typeof TICKET_STATUS;

export const categoryLabel = (k: string) =>
  TICKET_CATEGORIES.find((c) => c.key === k)?.label ?? k;
