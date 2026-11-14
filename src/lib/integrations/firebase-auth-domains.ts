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
