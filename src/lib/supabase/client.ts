import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a safe mock Proxy client during static build prerendering to prevent compiler failures
    return new Proxy({}, {
      get() {
        return () => {
          throw new Error("Supabase client accessed during build-time static prerendering before environment variables are initialized.");
        };
      }
    }) as any;
  }

  return createBrowserClient(url, key);
}
