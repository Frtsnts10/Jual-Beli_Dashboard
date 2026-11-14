import "server-only";

// Custom-domain automation (Ultimate). Attaches a store's domain to the storefront's
// Vercel project (routing + automatic TLS) and reads back what DNS the seller still has to
// set. Needs VERCEL_TOKEN + VERCEL_STOREFRONT_PROJECT_ID (+ VERCEL_TEAM_ID for team
// projects). Without them the platform admin adds domains in Vercel by hand and the
// dashboard only runs the live check.

const API = process.env.VERCEL_API_BASE ?? "https://api.vercel.com";

export function vercelDomainsEnabled() {
  return !!(process.env.VERCEL_TOKEN && process.env.VERCEL_STOREFRONT_PROJECT_ID);
}

async function vercel(method: string, path: string, body?: unknown) {
  const team = process.env.VERCEL_TEAM_ID ? `${path.includes("?") ? "&" : "?"}teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const res = await fetch(`${API}${path}${team}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

const project = () => encodeURIComponent(process.env.VERCEL_STOREFRONT_PROJECT_ID!);
const errorMessage = (data: Record<string, unknown>, status: number) =>
  (data.error as { message?: string } | undefined)?.message ?? `Vercel ${status}`;

// Second-level public suffixes common for Indonesian sellers; "toko.co.id" is an apex domain.
const TWO_LEVEL_SUFFIXES = new Set(["co.id", "my.id", "web.id", "biz.id", "or.id", "ac.id", "sch.id", "ponpes.id", "co.uk", "com.au", "com.sg", "com.my"]);

/** True for "toko.xyz" / "toko.co.id", false for "shop.toko.xyz". */
export function isApexDomain(domain: string) {
  const labels = domain.split(".");
  const suffix = labels.slice(-2).join(".");
  return labels.length === (TWO_LEVEL_SUFFIXES.has(suffix) ? 3 : 2);
}

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  /** Host/name field as most DNS panels expect it ("@" for the apex). */
  name: string;
  value: string;
  purpose: string;
}

/** The records the seller must create for the domain to point at the storefront. */
/** "_vercel.shop.tokoku.com" → "_vercel.shop": the relative host DNS panels ask for. */
function relativeName(fqdn: string, domain: string) {
  const labels = domain.split(".");
  const apexLabels = TWO_LEVEL_SUFFIXES.has(labels.slice(-2).join(".")) ? 3 : 2;
  const apex = labels.slice(-apexLabels).join(".");
  return fqdn === apex ? "@" : fqdn.endsWith(`.${apex}`) ? fqdn.slice(0, -(apex.length + 1)) : fqdn;
}

export function routingRecords(domain: string): DnsRecord[] {
  if (isApexDomain(domain)) {
    return [
      { type: "A", name: "@", value: "76.76.21.21", purpose: "Domain utama ke etalase" },
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com", purpose: "www ikut diarahkan" },
    ];
  }
  const apexLabels = TWO_LEVEL_SUFFIXES.has(domain.split(".").slice(-2).join(".")) ? 3 : 2;
  const host = domain.split(".").slice(0, -apexLabels).join(".");
  return [{ type: "CNAME", name: host, value: "cname.vercel-dns.com", purpose: "Subdomain ke etalase" }];
}

/** Adds the domain (and, for an apex, www → apex redirect) to the storefront project. */
export async function addDomain(domain: string) {
  const res = await vercel("POST", `/v10/projects/${project()}/domains`, { name: domain });
  if (!res.ok && res.status !== 409) throw new Error(errorMessage(res.data, res.status));
  if (isApexDomain(domain)) {
    const www = await vercel("POST", `/v10/projects/${project()}/domains`, { name: `www.${domain}`, redirect: domain, redirectStatusCode: 308 });
    if (!www.ok && www.status !== 409) console.error(`Adding www.${domain} failed:`, errorMessage(www.data, www.status));
  }
}

export async function removeDomain(domain: string) {
  const names = isApexDomain(domain) ? [`www.${domain}`, domain] : [domain];
  for (const name of names) {
    const res = await vercel("DELETE", `/v9/projects/${project()}/domains/${encodeURIComponent(name)}`);
    if (!res.ok && res.status !== 404) throw new Error(errorMessage(res.data, res.status));
  }
}

export interface VercelDomainState {
  /** Domain is attached to the project and ownership is proven. */
  verified: boolean;
  /** DNS does not (yet) point at Vercel. */
  misconfigured: boolean;
  /** Extra TXT records Vercel asks for when the domain is also used in another Vercel account. */
  verification: DnsRecord[];
}

export async function inspectDomain(domain: string): Promise<VercelDomainState | null> {
  let info = await vercel("GET", `/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`);
  if (!info.ok) return null;
  if (info.data.verified !== true) {
    // Ask Vercel to re-check ownership now instead of waiting for its background job.
    const verify = await vercel("POST", `/v9/projects/${project()}/domains/${encodeURIComponent(domain)}/verify`);
    if (verify.ok) info = verify;
  }
  const config = await vercel("GET", `/v6/domains/${encodeURIComponent(domain)}/config`);
  const challenges = (info.data.verification as { type: string; domain: string; value: string }[] | undefined) ?? [];
  return {
    verified: info.data.verified === true,
    misconfigured: config.data.misconfigured !== false,
    verification: challenges.map((c) => ({ type: "TXT", name: relativeName(c.domain, domain), value: c.value, purpose: "Verifikasi kepemilikan" })),
  };
}
