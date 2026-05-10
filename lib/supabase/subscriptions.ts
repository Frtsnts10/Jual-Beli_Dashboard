import { createClient } from "@/lib/supabase/client";

export type Subscription = {
  id: string;
  profile_id: string;
  inventory_id: string | null;
  customer_name: string;
  customer_email: string | null;
  whatsapp_number: string;
  subscription_plan: string | null;
  selling_price: number | null;
  start_date: string;
  duration: number | null;
  expiry_date: string | null;
  inventory?: {
    app_name: string;
    capital_cost: number;
  };
};

export function subscribeToSubscriptions(profileId: string | undefined, callback: (items: Subscription[]) => void) {
  if (!profileId) {
    callback([]);
    return () => {};
  }

  const supabase = createClient();

  const fetchSubs = async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        inventory (
          app_name,
          capital_cost
        )
      `)
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscriptions:", error.message);
      return;
    }
    callback(data as Subscription[]);
  };

  fetchSubs();

  const channel = supabase
    .channel(`subs-${profileId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "subscriptions", filter: `profile_id=eq.${profileId}` },
      () => fetchSubs()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function addSubscription(sub: Omit<Subscription, "id" | "inventory">) {
  const supabase = createClient();
  const { error } = await supabase.from("subscriptions").insert(sub);
  if (error) throw error;
}

export async function updateSubscription(id: string, sub: Partial<Subscription>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update(sub)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSubscription(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
}
