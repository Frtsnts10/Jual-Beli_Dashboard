import "server-only";
import { randomUUID } from "node:crypto";
import { adminBucket } from "@/lib/firebase/admin";

export type { MediaKind } from "@/lib/media-kinds";
import type { MediaKind } from "@/lib/media-kinds";

const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/;
export const MAX_IMAGE_BYTES = 2_500_000;

/** Public download URL for an object (token URLs work without making the bucket public). */
function downloadUrl(bucket: string, path: string, token: string) {
  const host = process.env.FIREBASE_STORAGE_EMULATOR_HOST ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}` : "https://firebasestorage.googleapis.com";
  return `${host}/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

/**
 * Stores an already-compressed image (data URL from the browser) under stores/{storeId}/{kind}/
 * and returns its public URL. Bucket rules stay closed to clients: only the server writes,
 * and readers get the object through its download token.
 */
export async function saveImage(storeId: string, kind: MediaKind, dataUrl: string): Promise<string> {
  const m = dataUrl.match(DATA_URL_RE);
  if (!m) throw new Error("BAD_IMAGE");
  const bytes = Buffer.from(m[2], "base64");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("TOO_BIG");
  const ext = m[1] === "jpeg" ? "jpg" : m[1];
  const path = `stores/${storeId}/${kind}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const token = randomUUID();
  await adminBucket.file(path).save(bytes, {
    resumable: false,
    contentType: `image/${m[1]}`,
    metadata: { cacheControl: "public, max-age=31536000, immutable", metadata: { firebaseStorageDownloadTokens: token } },
  });
  return downloadUrl(adminBucket.name, path, token);
}
