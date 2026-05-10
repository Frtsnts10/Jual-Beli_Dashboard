import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | undefined;

export const createClient = () => {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error("Supabase URL or Anon Key is missing in environment variables!");
      // Return a dummy client or throw a more descriptive error if needed
    }

    client = createBrowserClient(url || "", key || "");
  }

  return client;
};
