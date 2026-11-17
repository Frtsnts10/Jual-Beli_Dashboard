// Spreadsheet import helpers (pure, used in the browser and in tests): CSV parsing, header
// matching and per-row validation for Brankas Stok and Produk imports. Nothing is written
// until the seller has seen the preview with every row's status.

import { PLATFORM_TYPES } from "@/config/tiers";
import type { PlatformType } from "@/types/schema";

/** RFC-4180-ish CSV: quoted fields, "" escapes, CRLF/LF; delimiter guessed from the header (, ; or tab). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = [",", ";", "\t"].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Finds each wanted column by any of its aliases; returns column indexes (or -1). */
export function matchColumns<K extends string>(header: string[], aliases: Record<K, string[]>): Record<K, number> {
  const h = header.map((c) => norm(String(c ?? "")));
  return Object.fromEntries(Object.entries(aliases).map(([k, names]) => [k, h.findIndex((c) => (names as string[]).map(norm).includes(c))])) as Record<K, number>;
}

/** Excel dates arrive as Date objects, CSV ones as text; both become YYYY-MM-DD ("" if empty). */
export function toDateText(v: unknown): string | null {
  if (v == null || v === "") return "";
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // 31/12/2026
  const iso = dmy ? `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}` : s;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !Number.isNaN(Date.parse(iso)) ? iso : null;
}

const text = (v: unknown) => (v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 10) : String(v).trim());

// ---------- Brankas Stok ----------

export const STOCK_TEMPLATE = [
  ["produk", "email", "password", "pin", "kedaluwarsa"],
  ["Netflix Premium 1 Bulan", "akun1@mail.com", "rahasia123", "1234", "2026-12-31"],
  ["Spotify Premium 1 Bulan", "akun2@mail.com", "rahasia456", "", ""],
];

export interface StockRow {
  line: number;
  productId: string | null;
  product: string;
  email: string;
  password: string;
  pin: string;
  expiry: string;
  error: string | null;
}

export function buildStockRows(table: unknown[][], products: { id: string; title: string }[]): { rows: StockRow[]; error: string | null } {
  if (table.length < 2) return { rows: [], error: "File kosong atau hanya berisi judul kolom." };
  const col = matchColumns(table[0].map(text), {
    product: ["produk", "product", "nama produk", "product_id", "id produk"],
    email: ["email", "akun", "username", "account_email", "user"],
    password: ["password", "pass", "kata sandi", "account_password"],
    pin: ["pin", "profile_pin", "pin profil"],
    expiry: ["kedaluwarsa", "expiry", "expiry_date", "expired", "berlaku sampai", "exp"],
  });
  if (col.email < 0 || col.password < 0) return { rows: [], error: "Kolom wajib tidak ditemukan: email dan password. Unduh template untuk contoh." };
  const byTitle = new Map(products.map((p) => [p.title.trim().toLowerCase(), p.id]));
  const ids = new Set(products.map((p) => p.id));
  const seen = new Set<string>();
  const rows = table.slice(1).map((r, i): StockRow => {
    const product = col.product >= 0 ? text(r[col.product]) : "";
    const productId = ids.has(product) ? product : (byTitle.get(product.toLowerCase()) ?? null);
    const email = text(r[col.email]);
    const password = text(r[col.password]);
    const expiry = col.expiry >= 0 ? toDateText(r[col.expiry]) : "";
    const key = `${productId}|${email.toLowerCase()}`;
    const error = !product
      ? "Kolom produk kosong"
      : !productId
        ? `Produk "${product}" tidak ada di toko`
        : !email || !password
          ? "Email & password wajib"
          : expiry === null
            ? "Tanggal tidak valid (pakai YYYY-MM-DD)"
            : seen.has(key)
              ? "Duplikat di file ini"
              : null;
    seen.add(key);
    return { line: i + 2, productId, product, email, password, pin: col.pin >= 0 ? text(r[col.pin]) : "", expiry: expiry ?? "", error };
  });
  return { rows, error: null };
}

// ---------- Produk ----------

export const PRODUCT_TEMPLATE = [
  ["judul", "kategori", "harga", "durasi_hari", "deskripsi", "gambar_url", "tampil"],
  ["Netflix Premium 1 Bulan", "Media", "45000", "30", "1 profil pribadi, Ultra HD.", "", "ya"],
  ["Canva Pro 1 Bulan", "Productivity", "30000", "30", "", "", "ya"],
];

export interface ProductRow {
  line: number;
  title: string;
  platform_type: PlatformType;
  price: number;
  duration_days: number;
  description: string;
  image_url: string;
  is_published: boolean;
  error: string | null;
}

const toInt = (v: unknown) => {
  if (typeof v === "number") return Math.round(v);
  const digits = text(v).replace(/[^\d]/g, "");
  return digits ? Number(digits) : NaN;
};

export function buildProductRows(table: unknown[][], existingTitles: string[]): { rows: ProductRow[]; error: string | null } {
  if (table.length < 2) return { rows: [], error: "File kosong atau hanya berisi judul kolom." };
  const col = matchColumns(table[0].map(text), {
    title: ["judul", "nama", "nama produk", "title", "produk"],
    category: ["kategori", "category", "platform", "platform_type", "jenis"],
    price: ["harga", "price"],
    duration: ["durasi", "durasi_hari", "durasi hari", "hari", "duration", "duration_days", "masa aktif"],
    description: ["deskripsi", "description", "keterangan"],
    image: ["gambar", "gambar_url", "image", "image_url", "foto"],
    published: ["tampil", "published", "aktif", "is_published"],
  });
  if (col.title < 0 || col.price < 0) return { rows: [], error: "Kolom wajib tidak ditemukan: judul dan harga. Unduh template untuk contoh." };
  const taken = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  const categories = new Map(PLATFORM_TYPES.map((c) => [c.toLowerCase(), c]));
  const rows = table.slice(1).map((r, i): ProductRow => {
    const title = text(r[col.title]);
    const rawCat = col.category >= 0 ? text(r[col.category]) : "";
    const platform_type = categories.get(rawCat.toLowerCase()) ?? "Other";
    const price = toInt(r[col.price]);
    const duration_days = col.duration >= 0 && text(r[col.duration]) ? toInt(r[col.duration]) : 30;
    const image_url = col.image >= 0 ? text(r[col.image]) : "";
    const pub = col.published >= 0 ? text(r[col.published]).toLowerCase() : "ya";
    const error =
      title.length < 2
        ? "Judul terlalu pendek"
        : taken.has(title.toLowerCase())
          ? "Judul sudah ada (di toko atau di baris lain)"
          : !Number.isInteger(price) || price < 1000
            ? "Harga minimal 1000"
            : !Number.isInteger(duration_days) || duration_days < 1 || duration_days > 3650
              ? "Durasi 1–3650 hari"
              : image_url && !/^https:\/\//.test(image_url)
                ? "URL gambar harus https://"
                : rawCat && !categories.has(rawCat.toLowerCase())
                  ? `Kategori "${rawCat}" tidak dikenal (${PLATFORM_TYPES.join(", ")})`
                  : null;
    taken.add(title.toLowerCase());
    return {
      line: i + 2,
      title,
      platform_type,
      price,
      duration_days,
      description: col.description >= 0 ? text(r[col.description]) : "",
      image_url,
      is_published: !["tidak", "no", "0", "false", "n", "sembunyi"].includes(pub),
      error,
    };
  });
  return { rows, error: null };
}

/** Rows → CSV text (for the downloadable templates). */
export function toCsv(rows: string[][]) {
  return rows.map((r) => r.map((c) => (/[",\n;]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
}
