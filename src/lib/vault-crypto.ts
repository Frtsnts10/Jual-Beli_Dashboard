import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Encryption at rest for vault secrets (account password + profile PIN). Even if the
// database is exposed (leaked service-account key, mis-set rules, a Firestore export),
// the premium accounts stay unreadable without VAULT_ENCRYPTION_KEY, which lives only in
// the dashboard's environment.
//
// Format: "enc:v1:<iv b64>:<tag b64>:<ciphertext b64>" — AES-256-GCM, random 96-bit IV.
// Values without the prefix are legacy plaintext and are returned as-is, so encryption can
// be switched on for an existing vault (see /api/cron/encrypt-vault).
//
// Generate a key with:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
// Never change or lose it: existing secrets cannot be decrypted without it.

const PREFIX = "enc:v1:";

function key(): Buffer | null {
  const raw = process.env.VAULT_ENCRYPTION_KEY;
  if (!raw) return null;
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("VAULT_ENCRYPTION_KEY must be 32 bytes, base64-encoded");
  return buf;
}

export const isEncrypted = (value: string) => value.startsWith(PREFIX);

export function encryptSecret(plain: string): string {
  if (!plain || isEncrypted(plain)) return plain;
  const k = key();
  if (!k) {
    // Production must never store plaintext; elsewhere (local dev, previews) warn only.
    if (process.env.VERCEL_ENV === "production") throw new Error("VAULT_ENCRYPTION_KEY is not set");
    console.warn("VAULT_ENCRYPTION_KEY not set — storing vault secret unencrypted");
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${PREFIX}${iv.toString("base64")}:${cipher.getAuthTag().toString("base64")}:${ct.toString("base64")}`;
}

export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!isEncrypted(stored)) return stored;
  const k = key();
  if (!k) throw new Error("VAULT_ENCRYPTION_KEY is not set but the vault contains encrypted secrets");
  const [iv, tag, ct] = stored.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]).toString("utf8");
}
