/**
 * Per-product stock settings ("Pengaturan stok & pengiriman"). Products are not all Netflix-style
 * logins: some sell a redeem code, some an invite link, and one account can be shared by several
 * buyers. Each product defines
 *   - type: what one vault entry is (login account / code / link),
 *   - fields: the columns of a vault entry (label, secret → encrypted at rest, required),
 *   - slots: how many buyers one entry can be sold to (sharing, e.g. 1 Netflix account → 5 profiles),
 *   - wa_template: the delivery message for this product ("" = store template / automatic).
 * Stored as products.stock_config; products without one behave as before (email/password/PIN, 1 buyer).
 * Client-safe (used by the product dialog and the add-stock dialog).
 */
export type DeliveryType = "account" | "code" | "link";

export interface StockField {
  /** Placeholder name in the WA template ({email}, {kode}…), derived from the label. */
  key: string;
  label: string;
  /** Encrypted in the vault and masked in tables (passwords, PINs, codes). */
  secret: boolean;
  required: boolean;
}

export interface StockConfig {
  type: DeliveryType;
  fields: StockField[];
  slots: number;
  wa_template: string;
}

export const DELIVERY_TYPES: { value: DeliveryType; label: string; hint: string }[] = [
  { value: "account", label: "Akun login", hint: "Email + password (+ PIN/profil). Contoh: Netflix, CapCut, Viu." },
  { value: "code", label: "Kode / voucher / lisensi", hint: "Satu kode per stok. Contoh: voucher, redeem code, license key." },
  { value: "link", label: "Link undangan", hint: "Link yang dikirim ke pembeli. Contoh: invite Canva, Spotify Family." },
];

export const PRESET_FIELDS: Record<DeliveryType, StockField[]> = {
  account: [
    { key: "email", label: "Email", secret: false, required: true },
    { key: "password", label: "Password", secret: true, required: true },
    { key: "pin", label: "PIN", secret: true, required: false },
  ],
  code: [{ key: "kode", label: "Kode", secret: true, required: true }],
  link: [{ key: "link", label: "Link", secret: false, required: true }],
};

export const MAX_FIELDS = 6;
export const MAX_SLOTS = 50;
/** Template placeholders every product has, besides its own fields. */
export const BASE_VARS = ["product", "store", "order_id", "expiry", "slot"] as const;

export const DEFAULT_STOCK_CONFIG: StockConfig = { type: "account", fields: PRESET_FIELDS.account, slots: 1, wa_template: "" };

/** "Nomor Profil" → "nomor_profil"; kept unique and clear of the base placeholders. */
export function fieldKey(label: string, taken: Set<string>) {
  const base =
    label
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20) || "kolom";
  let key = (BASE_VARS as readonly string[]).includes(base) ? `${base}_2` : base;
  for (let i = 2; taken.has(key); i++) key = `${base}_${i}`;
  return key;
}

/** Valid config from anything stored or submitted (missing → the old email/password/PIN behaviour). */
export function normalizeStockConfig(raw: unknown): StockConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_STOCK_CONFIG;
  const r = raw as Record<string, unknown>;
  const type: DeliveryType = DELIVERY_TYPES.some((t) => t.value === r.type) ? (r.type as DeliveryType) : "account";
  const taken = new Set<string>();
  const fields: StockField[] = [];
  for (const f of Array.isArray(r.fields) ? r.fields.slice(0, MAX_FIELDS) : []) {
    if (!f || typeof f !== "object") continue;
    const o = f as Record<string, unknown>;
    const label = String(o.label ?? "").trim().slice(0, 30);
    if (!label) continue;
    const wanted = typeof o.key === "string" && /^[a-z0-9_]{1,24}$/.test(o.key) && !taken.has(o.key) && !(BASE_VARS as readonly string[]).includes(o.key) ? o.key : fieldKey(label, taken);
    taken.add(wanted);
    fields.push({ key: wanted, label, secret: !!o.secret, required: !!o.required });
  }
  if (fields.length === 0) fields.push(...PRESET_FIELDS[type]);
  if (!fields.some((f) => f.required)) fields[0] = { ...fields[0], required: true };
  const slots = Math.min(MAX_SLOTS, Math.max(1, Math.floor(Number(r.slots) || 1)));
  const wa_template = typeof r.wa_template === "string" ? r.wa_template.slice(0, 2000) : "";
  return { type, fields, slots, wa_template };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface StockLine {
  values: Record<string, string>;
  expiry_date: string; // yyyy-mm-dd or ""
}

/** One vault entry per line, fields in order separated by "|", optional YYYY-MM-DD expiry last. */
export function parseStockLines(text: string, config: StockConfig): StockLine[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      let expiry = "";
      if (parts.length > config.fields.length && DATE_RE.test(parts[parts.length - 1])) expiry = parts.pop()!;
      else if (parts.length === config.fields.length && config.fields.length > 1 && DATE_RE.test(parts[parts.length - 1]) && !config.fields[config.fields.length - 1].required) {
        expiry = parts.pop()!;
      }
      const values: Record<string, string> = {};
      config.fields.forEach((f, i) => (values[f.key] = parts[i] ?? ""));
      return { values, expiry_date: expiry };
    });
}

/** "email|password|pin|YYYY-MM-DD" for the add-stock dialog. */
export const lineFormat = (config: StockConfig) => [...config.fields.map((f) => f.label.toLowerCase()), "YYYY-MM-DD"].join("|");

/** The automatic message for products without their own template (non-default fields). */
export function autoTemplate(config: StockConfig) {
  const intro = { account: "Berikut akun", code: "Berikut kode", link: "Berikut link" }[config.type];
  const lines = config.fields.map((f) => `${f.label}: {${f.key}}`);
  if (config.slots > 1) lines.push("Slot: {slot}");
  return `Halo! Terima kasih sudah order {product} di {store}.\n\n${intro} Anda:\n${lines.join("\n")}\nAktif s/d: {expiry}\n\nOrder ID: {order_id}`;
}

const isLegacyAccount = (c: StockConfig) =>
  c.type === "account" && c.fields.every((f) => ["email", "password", "pin"].includes(f.key));

/** Which template a delivery uses: the product's own, else the store's (classic accounts), else automatic. */
export function templateFor(config: StockConfig, storeTemplate: string) {
  if (config.wa_template.trim()) return config.wa_template;
  return isLegacyAccount(config) && config.slots === 1 ? storeTemplate : autoTemplate(config);
}

/**
 * The settings an existing vault entry was made with. When a product's fields change (e.g. a
 * login product becomes "link undangan"), entries added before keep their own columns: an entry
 * holding none of the current fields is read with the fields it does have (classic
 * email/password/PIN when they match), so it still shows in the vault and delivers correctly.
 */
export function entryConfig(config: StockConfig, values: Record<string, string>): StockConfig {
  if (config.fields.some((f) => values[f.key])) return config;
  const keys = Object.keys(values).filter((k) => values[k]);
  if (keys.length === 0) return config;
  const classic = PRESET_FIELDS.account;
  const fields = keys.map((k) => classic.find((f) => f.key === k) ?? { key: k, label: k, secret: false, required: false });
  return { type: "account", fields, slots: 1, wa_template: "" };
}
