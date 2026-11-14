import "server-only";

// Thin Xendit REST client. XenPlatform reference:
//   POST /v2/accounts        create a sub-account (MANAGED: seller completes KYC & withdraws)
//   GET  /v2/accounts/{id}   read status (INVITED → REGISTERED → AWAITING_DOCS → LIVE)
//   POST /v2/invoices        hosted invoice; on behalf of a sub-account via `for-user-id`
// Set XENDIT_API_BASE to point at a mock in tests.

const BASE = process.env.XENDIT_API_BASE ?? "https://api.xendit.co";

export class XenditError extends Error {
  constructor(public status: number, public body: string) {
    super(`Xendit ${status}: ${body}`);
  }
}

export async function xendit<T>(method: "GET" | "POST", path: string, body?: unknown, headers: Record<string, string> = {}): Promise<T> {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY is not set");
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new XenditError(res.status, text);
  return JSON.parse(text) as T;
}

export type AccountStatus = "INVITED" | "REGISTERED" | "AWAITING_DOCS" | "LIVE" | "SUSPENDED";

export interface XenditAccount {
  id: string;
  status: AccountStatus;
}

export function createManagedAccount(email: string, businessName: string) {
  return xendit<XenditAccount>("POST", "/v2/accounts", {
    email,
    type: "MANAGED",
    public_profile: { business_name: businessName },
  });
}

export function getAccount(id: string) {
  return xendit<XenditAccount>("GET", `/v2/accounts/${encodeURIComponent(id)}`);
}

export function createInvoice(body: {
  external_id: string;
  amount: number;
  description: string;
  payer_email: string;
  success_redirect_url: string;
  failure_redirect_url: string;
}) {
  return xendit<{ id: string; invoice_url: string }>("POST", "/v2/invoices", {
    ...body,
    currency: "IDR",
    invoice_duration: 24 * 60 * 60,
  });
}
