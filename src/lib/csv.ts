/** Neutralises spreadsheet formula injection ("=HYPERLINK(...)" in a buyer-typed field) and quotes as needed. */
export function csvCell(value: unknown) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** UTF-8 CSV with a BOM so Excel opens names with accents/emoji correctly. */
export function toCsv(rows: unknown[][]) {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
