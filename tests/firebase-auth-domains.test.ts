import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase/admin", () => ({ FIREBASE_PROJECT_ID: "web-store-dashboard", adminAccessToken: async () => "tok" }));

describe("updateAuthorizedDomains", () => {
  let domains: string[];
  const calls: { method: string; url: string; body?: unknown }[] = [];

  beforeEach(() => {
    domains = ["localhost", "web-store-dashboard.firebaseapp.com", "old.com", "www.old.com"];
    calls.length = 0;
    vi.stubEnv("IDENTITY_TOOLKIT_API_BASE", "https://itk.test");
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "");
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      const body = init.body ? JSON.parse(String(init.body)) : undefined;
      calls.push({ method: init.method!, url, body });
      expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
      if (init.method === "PATCH") domains = body.authorizedDomains;
      return new Response(JSON.stringify({ authorizedDomains: domains }), { status: 200 });
    });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("adds a domain and its www alias, keeping the existing ones", async () => {
    const { updateAuthorizedDomains, domainHosts } = await import("@/lib/integrations/firebase-auth-domains");
    await updateAuthorizedDomains({ add: domainHosts("dionycte.com") });
    expect(calls.map((c) => c.method)).toEqual(["GET", "PATCH"]);
    expect(calls[1].url).toBe("https://itk.test/admin/v2/projects/web-store-dashboard/config?updateMask=authorizedDomains");
    expect(domains).toEqual(["localhost", "web-store-dashboard.firebaseapp.com", "old.com", "www.old.com", "dionycte.com", "www.dionycte.com"]);
  });

  it("removes a domain and skips the write when nothing changes", async () => {
    const { updateAuthorizedDomains, domainHosts } = await import("@/lib/integrations/firebase-auth-domains");
    await updateAuthorizedDomains({ remove: domainHosts("old.com") });
    expect(domains).toEqual(["localhost", "web-store-dashboard.firebaseapp.com"]);
    calls.length = 0;
    await updateAuthorizedDomains({ add: ["localhost"] });
    expect(calls.map((c) => c.method)).toEqual(["GET"]);
  });

  it("does nothing against the Auth emulator", async () => {
    vi.stubEnv("FIREBASE_AUTH_EMULATOR_HOST", "127.0.0.1:9099");
    const { updateAuthorizedDomains } = await import("@/lib/integrations/firebase-auth-domains");
    await updateAuthorizedDomains({ add: ["x.com"] });
    expect(calls).toHaveLength(0);
  });
  it("registers a store subdomain under the root domain and swaps it on rename", async () => {
    vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "belidi.biz.id");
    const { syncStoreSubdomain } = await import("@/lib/integrations/firebase-auth-domains");
    await syncStoreSubdomain({ add: "dionycte" });
    expect(domains).toContain("dionycte.belidi.biz.id");
    await syncStoreSubdomain({ add: "dion", remove: "dionycte" });
    expect(domains).toContain("dion.belidi.biz.id");
    expect(domains).not.toContain("dionycte.belidi.biz.id");
  });
});
