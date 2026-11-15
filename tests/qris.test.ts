import { describe, expect, it } from "vitest";
import { crc16, inspectQris, parseTlv, qrisWithAmount } from "@/lib/qris";

const tlv = (id: string, v: string) => `${id}${String(v.length).padStart(2, "0")}${v}`;
// A static QRIS like the ones printed by banks/e-wallets (merchant info in tag 26, NMID in 51).
const body =
  tlv("00", "01") +
  tlv("01", "11") +
  tlv("26", tlv("00", "ID.CO.QRIS.WWW") + tlv("01", "936009150000000001") + tlv("02", "ID1020012345678")) +
  tlv("51", tlv("00", "ID.CO.QRIS.WWW") + tlv("02", "ID1020012345678") + tlv("03", "UMI")) +
  tlv("52", "5732") +
  tlv("53", "360") +
  tlv("58", "ID") +
  tlv("59", "DIONYCTE STORE") +
  tlv("60", "JAKARTA") +
  "6304";
const STATIC = body + crc16(body);

describe("qris", () => {
  it("computes CRC-16/CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("accepts a valid static QRIS and reads the merchant", () => {
    expect(inspectQris(STATIC)).toEqual({ ok: true, merchant: "DIONYCTE STORE", city: "JAKARTA", nmid: "ID1020012345678" });
  });

  it("rejects non-QRIS, broken or tampered codes", () => {
    expect(inspectQris("https://example.com")).toMatchObject({ ok: false });
    expect(inspectQris(STATIC.slice(0, -10))).toMatchObject({ ok: false });
    expect(inspectQris(STATIC.replace("DIONYCTE", "DIONYCTX"))).toMatchObject({ ok: false, error: expect.stringContaining("Checksum") });
  });

  it("fixes the amount: dynamic tag, tag 54, ascending order, fresh CRC", () => {
    const dyn = qrisWithAmount(STATIC, 45023);
    const tags = parseTlv(dyn)!;
    expect(tags.find((t) => t.id === "01")?.value).toBe("12");
    expect(tags.find((t) => t.id === "54")?.value).toBe("45023");
    expect(tags.map((t) => t.id)).toEqual(["00", "01", "26", "51", "52", "53", "54", "58", "59", "60", "63"]);
    expect(inspectQris(dyn)).toMatchObject({ ok: true, merchant: "DIONYCTE STORE" });
    // Re-applying replaces the amount instead of adding a second one.
    expect(parseTlv(qrisWithAmount(dyn, 1000))!.filter((t) => t.id === "54")).toEqual([{ id: "54", value: "1000" }]);
  });
});
