import "server-only";
import { adminAuth, adminBucket, adminDb } from "@/lib/firebase/admin";
import { adminEmails } from "@/lib/access/platform";
import { removeDomain, vercelDomainsEnabled } from "@/lib/integrations/vercel-domains";

/** Platform-level data that a reset never touches: settings (QRIS, catalog) and the audit log. */
const KEEP_COLLECTIONS = new Set(["platform", "platform_audit"]);
/** Collections keyed by uid where platform admins' own documents are kept. */
const PER_UID = new Set(["users", "push_tokens"]);
/** Storage folder for platform-level files (kept). */
const KEEP_STORAGE_PREFIX = "platform/";

export interface ResetSummary {
  collections: number;
  users: number;
  files: number;
  keptAdmins: number;
}

/** Every login whose email is on PLATFORM_ADMIN_EMAILS. */
async function adminUids(): Promise<Set<string>> {
  const emails = adminEmails();
  const uids = new Set<string>();
  for (let i = 0; i < emails.length; i += 100) {
    const res = await adminAuth.getUsers(emails.slice(i, i + 100).map((email) => ({ email })));
    res.users.forEach((u) => uids.add(u.uid));
  }
  return uids;
}

/**
 * Resets the platform to empty: every store, product, order, buyer, seller, plan payment, ticket,
 * notification, uploaded file and login is deleted. Kept: platform admins (their login, users doc
 * and push tokens), platform settings (QRIS, plans/themes catalog), the audit log and files under
 * platform/ in Storage. There is no undo.
 */
export async function resetPlatformData(): Promise<ResetSummary> {
  const keep = await adminUids();
  if (keep.size === 0) throw new Error("No platform admin login found; refusing to reset.");

  // Custom domains first, while the stores still say which ones they are.
  if (vercelDomainsEnabled()) {
    const domains = await adminDb.collection("store_domains").select().get();
    for (const d of domains.docs) await removeDomain(d.id).catch(() => {});
  }

  let collections = 0;
  for (const col of await adminDb.listCollections()) {
    if (KEEP_COLLECTIONS.has(col.id)) continue;
    collections++;
    if (!PER_UID.has(col.id)) {
      await adminDb.recursiveDelete(col);
      continue;
    }
    const docs = await col.select("uid").get();
    for (const d of docs.docs) {
      const owner = col.id === "users" ? d.id : (d.get("uid") as string | undefined);
      if (owner && keep.has(owner)) continue;
      await adminDb.recursiveDelete(d.ref);
    }
  }

  // Logins, except the admins'.
  let users = 0;
  let pageToken: string | undefined;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    const doomed = page.users.map((u) => u.uid).filter((uid) => !keep.has(uid));
    if (doomed.length) users += (await adminAuth.deleteUsers(doomed)).successCount;
    pageToken = page.pageToken;
  } while (pageToken);

  // Uploaded files (store images, banners, support screenshots), except platform/.
  let files = 0;
  const [all] = await adminBucket.getFiles();
  for (const f of all) {
    if (f.name.startsWith(KEEP_STORAGE_PREFIX)) continue;
    await f.delete({ ignoreNotFound: true }).catch(() => {});
    files++;
  }

  return { collections, users, files, keptAdmins: keep.size };
}
