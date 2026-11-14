import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptSecret, encryptSecret, isEncrypted } from "@/lib/vault-crypto";

describe("vault crypto", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips and never stores plaintext when a key is set", () => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    const enc = encryptSecret("hunter2");
    expect(isEncrypted(enc)).toBe(true);
    expect(enc).not.toContain("hunter2");
    expect(decryptSecret(enc)).toBe("hunter2");
    // Random IV: same input, different ciphertext.
    expect(encryptSecret("hunter2")).not.toBe(enc);
  });

  it("rejects tampered ciphertext", () => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    const enc = encryptSecret("secret");
    const parts = enc.split(":");
    parts[4] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });

  it("reads legacy plaintext and empty values as-is", () => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
    expect(decryptSecret("plain-old")).toBe("plain-old");
    expect(decryptSecret(null)).toBe("");
    expect(encryptSecret("")).toBe("");
  });

  it("refuses to store plaintext in production without a key", () => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", "");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(() => encryptSecret("x")).toThrow(/VAULT_ENCRYPTION_KEY/);
  });

  it("rejects a key of the wrong length", () => {
    vi.stubEnv("VAULT_ENCRYPTION_KEY", Buffer.from("short").toString("base64"));
    expect(() => encryptSecret("x")).toThrow(/32 bytes/);
  });
});
