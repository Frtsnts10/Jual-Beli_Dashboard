import { describe, expect, it } from "vitest";
import { cleanOverrides, mergeCatalog, planPerks, resolveFeatures, templateFor } from "@/lib/catalog-core";
import { TIERS } from "@/config/tiers";

describe("mergeCatalog", () => {
  it("adds admin-created plans and orders every plan by price, Starter first", () => {
    const c = mergeCatalog({
      plans: {
        business: { custom: true, name: "Business", priceMonthly: 149000, priceYearly: 1490000, vouchers: true },
        mega: { custom: true, name: "Mega", priceMonthly: 499000 },
        stray: { name: "Not flagged" },
        "Bad Key": { custom: true, name: "x" },
      },
    });
    expect(c.customPlans.sort()).toEqual(["business", "mega"]);
    expect(c.planKeys).toEqual(["starter", "pro", "business", "ultimate", "mega"]);
    expect(c.plans.business).toMatchObject({ name: "Business", priceMonthly: 149000, vouchers: true, maxStores: TIERS.pro.maxStores });
    expect(resolveFeatures(c, "business").name).toBe("Business");
    expect(resolveFeatures(c, "deleted-plan").name).toBe(c.plans.starter.name);
  });
  it("is the built-in plans and templates when nothing is stored", () => {
    const c = mergeCatalog(null);
    expect(c.plans.pro).toEqual(TIERS.pro);
    expect(c.templates.every((t) => t.enabled && t.style.radius === null)).toBe(true);
  });
  it("applies stored values, null = unlimited, and ignores junk", () => {
    const c = mergeCatalog({
      plans: { starter: { name: "Gratis", maxStores: null, vouchers: true, templates: ["template_a_bento", "nope"], priceMonthly: -5 } },
      templates: { template_e_brutalist: { enabled: false, name: "Brutal", style: { radius: "md", font: "mono", accent: "#ff0000" } }, template_a_bento: { style: { radius: "huge", accent: "red" } } },
    });
    expect(c.plans.starter).toMatchObject({ name: "Gratis", maxStores: Infinity, vouchers: true, templates: ["template_a_bento"], priceMonthly: 0 });
    const brut = c.templates.find((t) => t.id === "template_e_brutalist")!;
    expect(brut).toMatchObject({ enabled: false, name: "Brutal", style: { radius: "md", font: "mono", accent: "#ff0000" } });
    expect(c.templates.find((t) => t.id === "template_a_bento")!.style).toEqual({ radius: null, font: null, accent: null });
  });
  it("never ends up with every template switched off", () => {
    const off = Object.fromEntries(["template_a_bento", "template_b_list", "template_c_hero", "template_d_appstore", "template_e_brutalist"].map((t) => [t, { enabled: false }]));
    expect(mergeCatalog({ templates: off }).templates.filter((t) => t.enabled)).toHaveLength(1);
  });
});

describe("resolveFeatures", () => {
  const catalog = mergeCatalog({ templates: { template_d_appstore: { enabled: false } } });
  it("is the plan without overrides, minus disabled templates", () => {
    const f = resolveFeatures(catalog, "pro");
    expect(f.vouchers).toBe(true);
    expect(f.templates).not.toContain("template_d_appstore");
  });
  it("overrides switch features, add templates and change limits for one seller", () => {
    const f = resolveFeatures(catalog, "starter", cleanOverrides({ features: { vouchers: true, autoFulfillment: false, bogus: true }, templates: ["template_e_brutalist", "template_d_appstore"], maxStores: null, maxCredentials: 500 }));
    expect(f.vouchers).toBe(true);
    expect(f.templates).toEqual(["template_b_list", "template_c_hero", "template_e_brutalist"]); // appstore is off platform-wide
    expect(f.maxStores).toBe(Infinity);
    expect(f.maxCredentials).toBe(500);
    const pro = resolveFeatures(catalog, "pro", { features: { vouchers: false } });
    expect(pro.vouchers).toBe(false);
  });
  it("falls back to an allowed template", () => {
    const f = resolveFeatures(catalog, "starter");
    expect(templateFor("template_a_bento", f)).toBe("template_b_list");
    expect(templateFor("template_c_hero", f)).toBe("template_c_hero");
  });
});

it("planPerks lists limits and switched-on features", () => {
  expect(planPerks(TIERS.starter)).toEqual(["1 toko", "50 stok tersedia", "2 template etalase", "Kirim akun manual via WA", "Tanpa fee transaksi"]);
  expect(planPerks(TIERS.ultimate)).toContain("Domain sendiri");
});
