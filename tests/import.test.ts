import { describe, expect, it } from "vitest";
import { buildProductRows, buildStockRows, parseCsv, toDateText } from "@/lib/import/table";

describe("spreadsheet import", () => {
  it("parses CSV with quotes, semicolons and CRLF", () => {
    expect(parseCsv('a,b\r\n"x, y","he said ""hi"""\n')).toEqual([["a", "b"], ["x, y", 'he said "hi"']]);
    expect(parseCsv("produk;email\nNetflix;a@b.c\n")).toEqual([["produk", "email"], ["Netflix", "a@b.c"]]);
  });

  it("normalises dates", () => {
    expect(toDateText("2026-12-31")).toBe("2026-12-31");
    expect(toDateText("31/12/2026")).toBe("2026-12-31");
    expect(toDateText(new Date("2026-01-05T00:00:00Z"))).toBe("2026-01-05");
    expect(toDateText("")).toBe("");
    expect(toDateText("besok")).toBeNull();
  });

  it("checks stock rows: product by title or id, required fields, dates, duplicates", () => {
    const products = [{ id: "p1", title: "Netflix Premium 1 Bulan" }];
    const { rows, error } = buildStockRows(
      [
        ["Produk", "Email", "Password", "PIN", "Kedaluwarsa"],
        ["netflix premium 1 bulan", "a@x.id", "pw", "1234", "31/12/2026"],
        ["p1", "b@x.id", "pw", "", ""],
        ["Spotify", "c@x.id", "pw", "", ""],
        ["p1", "d@x.id", "", "", ""],
        ["p1", "e@x.id", "pw", "", "kapan"],
        ["p1", "A@x.id", "pw", "", ""],
      ],
      products
    );
    expect(error).toBeNull();
    expect(rows.map((r) => r.error)).toEqual([null, null, 'Produk "Spotify" tidak ada di toko', "Email & password wajib", "Tanggal tidak valid (pakai YYYY-MM-DD)", "Duplikat di file ini"]);
    expect(rows[0]).toMatchObject({ productId: "p1", expiry: "2026-12-31", pin: "1234", line: 2 });
  });

  it("asks for the required stock columns", () => {
    expect(buildStockRows([["produk", "akun"], ["x", "y"]], []).error).toMatch(/password/);
  });

  it("checks product rows", () => {
    const { rows } = buildProductRows(
      [
        ["judul", "kategori", "harga", "durasi_hari", "tampil"],
        ["Canva Pro", "productivity", "Rp 30.000", "30", "ya"],
        ["Netflix", "Media", "45000", "", "tidak"],
        ["Canva Pro", "Media", "30000", "30", ""],
        ["Murah", "Media", "500", "30", ""],
        ["Aneh", "Game", "5000", "30", ""],
      ],
      ["netflix"]
    );
    expect(rows[0]).toMatchObject({ platform_type: "Productivity", price: 30000, duration_days: 30, is_published: true, error: null });
    expect(rows[1].error).toMatch(/sudah ada/);
    expect(rows[2].error).toMatch(/sudah ada/);
    expect(rows[3].error).toBe("Harga minimal 1000");
    expect(rows[4].error).toMatch(/Kategori "Game"/);
  });
});
