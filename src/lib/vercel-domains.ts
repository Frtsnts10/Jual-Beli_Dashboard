import "server-only";

// Custom-domain automation (Ultimate): attach a store's domain to the storefront's Vercel
// project so it gets routed and receives a TLS certificate. Needs VERCEL_TOKEN and
// VERCEL_STOREFRONT_PROJECT_ID (+ VERCEL_TEAM_ID for team projects). Without them the
// seller's domain is only saved, and must be added in Vercel by hand.

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
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

const project = () => encodeURIComponent(process.env.VERCEL_STOREFRONT_PROJECT_ID!);

export async function addProjectDomain(domain: string) {
  const res = await vercel("POST", `/v10/projects/${project()}/domains`, { name: domain });
  // 409: already on this project — fine.
  if (!res.ok && res.status !== 409) {
    const message = (res.data.error as { message?: string } | undefined)?.message ?? `Vercel ${res.status}`;
    throw new Error(message);
  }
}

export async function removeProjectDomain(domain: string) {
  const res = await vercel("DELETE", `/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`);
  if (!res.ok && res.status !== 404) throw new Error(`Vercel ${res.status}`);
}

export interface DomainStatus {
  verified: boolean;
  misconfigured: boolean;
  /** DNS record the seller should create. */
  record: { type: "A" | "CNAME"; name: string; value: string };
}

export async function getDomainStatus(domain: string): Promise<DomainStatus | null> {
  const [project_, config] = await Promise.all([
    vercel("GET", `/v9/projects/${project()}/domains/${encodeURIComponent(domain)}`),
    vercel("GET", `/v6/domains/${encodeURIComponent(domain)}/config`),
  ]);
  if (!project_.ok) return null;
  const apex = domain.split(".").length === 2;
  return {
    verified: project_.data.verified === true,
    misconfigured: config.data.misconfigured !== false,
    record: apex ? { type: "A", name: "@", value: "76.76.21.21" } : { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" },
  };
}
