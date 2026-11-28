import { describe, expect, it } from "vitest";
import { autoTemplate, entryConfig, normalizeStockConfig, parseStockLines, templateFor } from "@/lib/stock-config";
import { deliveryMessage } from "@/lib/integrations/whatsapp";

describe("stock config", () => {
  it("defaults to the classic email/password/PIN account", () => {
    const c = normalizeStockConfig(undefined);
    expect(c.type).toBe("account");
    expect(c.fields.map((f) => f.key)).toEqual(["email", "password", "pin"]);
    expect(c.slots).toBe(1);
  });

  it("keeps keys, derives new ones from labels and clamps slots", () => {
    const c = normalizeStockConfig({ type: "account", slots: 999, fields: [{ key: "email", label: "Email" }, { label: "Nomor Profil" }, { label: "Product" }] });
    expect(c.fields.map((f) => f.key)).toEqual(["email", "nomor_profil", "product_2"]);
    expect(c.fields[0].required).toBe(true); // at least one field is required
    expect(c.slots).toBe(50);
  });

  it("parses lines in field order with an optional expiry date", () => {
    const c = normalizeStockConfig({ type: "code", fields: [{ key: "kode", label: "Kode", required: true }] });
    expect(parseStockLines("AAA-111|2026-12-31\nBBB-222\n\n", c)).toEqual([
      { values: { kode: "AAA-111" }, expiry_date: "2026-12-31" },
      { values: { kode: "BBB-222" }, expiry_date: "" },
    ]);
    const acc = normalizeStockConfig(undefined);
    expect(parseStockLines("a@x.com|pw|2026-01-02", acc)[0]).toEqual({ values: { email: "a@x.com", password: "pw", pin: "" }, expiry_date: "2026-01-02" });
  });

  it("picks the product template, else the store's for classic accounts, else an automatic one", () => {
    const store = "STORE {email}";
    expect(templateFor(normalizeStockConfig(undefined), store)).toBe(store);
    const link = normalizeStockConfig({ type: "link", fields: [{ key: "link", label: "Link", required: true }] });
    expect(templateFor(link, store)).toBe(autoTemplate(link));
    expect(templateFor({ ...link, wa_template: "Gabung: {link}" }, store)).toBe("Gabung: {link}");
    // Sharing always says which slot the buyer got.
    expect(autoTemplate({ ...normalizeStockConfig(undefined), slots: 5 })).toContain("{slot}");
  });

  it("fills field values and slot, and blanks unknown placeholders", () => {
    const msg = deliveryMessage({ store: "Toko", order_id: "ORD-1", expiry: "1 Jan" }, [
      { product: "Canva", template: "{product} {link} slot {slot} {kode} {store}", values: { link: "https://x" }, slot: "2/5" },
    ]);
    expect(msg).toBe("Canva https://x slot 2/5 - Toko");
  });

  it("reads entries added before a field change with their own columns", () => {
    const link = normalizeStockConfig({ type: "link", fields: [{ key: "link", label: "Link", required: true }] });
    const old = entryConfig(link, { email: "a@x.com", password: "pw", pin: "" });
    expect(old.fields.map((f) => f.label)).toEqual(["Email", "Password"]);
    expect(templateFor(old, "STORE")).toBe("STORE");
    expect(entryConfig(link, { link: "https://x" })).toBe(link);
  });
});
