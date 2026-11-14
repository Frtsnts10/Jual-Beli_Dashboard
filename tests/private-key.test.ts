import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { formatPrivateKey } from "@/lib/firebase/private-key";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const escaped = pem.replace(/\n/g, "\\n");

// Each variant is how the key commonly ends up in a hosting dashboard's env var field.
const variants: Record<string, string> = {
  "plain PEM": pem,
  "escaped newlines (as in the JSON file)": escaped,
  "wrapped in quotes": `"${escaped}"`,
  "with the trailing JSON comma": `"${escaped}",`,
  "the whole JSON line": `"private_key": "${escaped}",`,
  "on one line with spaces": pem.replace(/\n/g, " "),
  "with Windows line endings": pem.replace(/\n/g, "\r\n"),
};

describe("formatPrivateKey", () => {
  for (const [name, input] of Object.entries(variants)) {
    it(`yields a parseable key: ${name}`, () => {
      const out = formatPrivateKey(input);
      expect(out).toBe(pem);
      expect(() => createPrivateKey(out!)).not.toThrow();
    });
  }

  it("returns undefined for an empty value", () => {
    expect(formatPrivateKey(undefined)).toBeUndefined();
    expect(formatPrivateKey("")).toBeUndefined();
    expect(formatPrivateKey('""')).toBeUndefined();
  });
});
