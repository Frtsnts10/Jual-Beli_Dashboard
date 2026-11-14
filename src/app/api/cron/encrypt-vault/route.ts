import { NextRequest, NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { encryptSecret, isEncrypted } from "@/lib/vault-crypto";

// One-off-safe migration: encrypts vault secrets stored before VAULT_ENCRYPTION_KEY was
// set. Walks credentials_vault in pages, remembering its position in
// platform_config/vault_encryption, so it is cheap to keep scheduled (vercel.json) — once
// everything is encrypted each run is a single small read. Same CRON_SECRET as the others.

const PAGE = 400;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.VAULT_ENCRYPTION_KEY) return NextResponse.json({ error: "VAULT_ENCRYPTION_KEY not set" }, { status: 412 });

  const stateRef = adminDb.collection("platform_config").doc("vault_encryption");
  const state = await stateRef.get();
  if (state.get("done") === true) return NextResponse.json({ done: true, encrypted: 0 });

  let q = adminDb.collection("credentials_vault").orderBy(FieldPath.documentId()).limit(PAGE);
  const cursor = state.get("cursor") as string | undefined;
  if (cursor) q = q.startAfter(cursor);
  const page = await q.get();

  const batch = adminDb.batch();
  let encrypted = 0;
  for (const doc of page.docs) {
    const pw = (doc.get("account_password") as string) ?? "";
    const pin = (doc.get("profile_pin") as string) ?? "";
    if ((pw && !isEncrypted(pw)) || (pin && !isEncrypted(pin))) {
      batch.update(doc.ref, { account_password: encryptSecret(pw), profile_pin: encryptSecret(pin) });
      encrypted++;
    }
  }
  const done = page.size < PAGE;
  batch.set(stateRef, { cursor: page.docs.at(-1)?.id ?? cursor ?? null, done }, { merge: true });
  await batch.commit();
  return NextResponse.json({ done, scanned: page.size, encrypted });
}
