import "server-only";
import { adminAccessToken, FIREBASE_PROJECT_ID } from "@/lib/firebase/admin";

// Google sign-in on a storefront only works on hosts listed in Firebase Authentication →
// Settings → Authorized domains. Connecting a custom domain adds it (and www.) there;
// disconnecting removes them. Uses the Identity Toolkit admin API with the dashboard's
// service account (needs the "Firebase Authentication Admin" role, which the default
// firebase-adminsdk account has). Best effort: a failure never blocks the domain flow —
// email/password sign-in works without it.

const API = process.env.IDENTITY_TOOLKIT_API_BASE ?? "https://identitytoolkit.googleapis.com";
const configUrl = `${API}/admin/v2/projects/${FIREBASE_PROJECT_ID}/config`;

export function authDomainsEnabled() {
  // The Auth emulator accepts any domain; nothing to register.
  return !process.env.FIREBASE_AUTH_EMULATOR_HOST && (!!process.env.FIREBASE_PRIVATE_KEY || !!process.env.IDENTITY_TOOLKIT_API_BASE);
}

async function call(method: "GET" | "PATCH", body?: unknown) {
  const res = await fetch(method === "PATCH" ? `${configUrl}?updateMask=authorizedDomains` : configUrl, {
    method,
    headers: { Authorization: `Bearer ${await adminAccessToken()}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { authorizedDomains?: string[]; error?: { message?: string } };
  if (!res.ok) throw new Error(`Identity Toolkit ${res.status}: ${data.error?.message ?? "request failed"}`);
  return data;
}

/** Adds and/or removes hosts from the authorized-domains list in one read-modify-write. */
export async function updateAuthorizedDomains(change: { add?: string[]; remove?: string[] }) {
  if (!authDomainsEnabled()) return;
  const current = (await call("GET")).authorizedDomains ?? [];
  const remove = new Set(change.remove ?? []);
  const next = [...new Set([...current.filter((d) => !remove.has(d)), ...(change.add ?? [])])];
  if (next.length === current.length && next.every((d) => current.includes(d))) return;
  await call("PATCH", { authorizedDomains: next });
}

/** The apex and its www. alias — both serve the store. */
export const domainHosts = (domain: string) => (domain.startsWith("www.") ? [domain, domain.slice(4)] : [domain, `www.${domain}`]);

/** A store's own subdomain (`<slug>.<root domain>`), or null without NEXT_PUBLIC_ROOT_DOMAIN. */
export function subdomainHost(slug: string): string | null {
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  return root ? `${slug}.${root}` : null;
}

/**
 * Firebase has no wildcard authorized domains, so every store subdomain is registered on its own:
 * when a store is created, renamed or deleted. Best effort — logs instead of failing the action.
 */
export async function syncStoreSubdomain(change: { add?: string | null; remove?: string | null }) {
  const add = change.add ? subdomainHost(change.add) : null;
  const remove = change.remove ? subdomainHost(change.remove) : null;
  if (!add && !remove) return;
  await updateAuthorizedDomains({ add: add ? [add] : [], remove: remove ? [remove] : [] }).catch((err) =>
    console.error("authorized domains update failed", err),
  );
}

/**
 * Registers every store's subdomain and connected custom domain (for stores created before this
 * was automatic). Returns how many hosts were checked; throws when the API call fails.
 */
export async function syncAllStoreDomains(): Promise<number> {
  if (!authDomainsEnabled()) return 0;
  const { adminDb } = await import("@/lib/firebase/admin");
  const stores = await adminDb.collection("stores").select("slug", "custom_domain").get();
  const hosts = stores.docs.flatMap((s) => {
    const sub = subdomainHost(s.get("slug") as string);
    const domain = s.get("custom_domain") as string | null;
    return [...(sub ? [sub] : []), ...(domain ? domainHosts(domain) : [])];
  });
  await updateAuthorizedDomains({ add: hosts });
  return hosts.length;
}
