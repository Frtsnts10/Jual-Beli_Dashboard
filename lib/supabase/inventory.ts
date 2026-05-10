import { createClient } from "@/lib/supabase/client";

export type InventoryItem = {
  id: string;
  profile_id: string;
  app_name: string;
  profile_name: string | null;
  login_email: string;
  login_password: string;
  capital_cost: number | null;
  restock_date: string | null;
  supplier_billing_date: string | null;
  status: "Tersedia" | "Terjual" | "Nonaktif";
};

export function subscribeToInventory(profileId: string | undefined, callback: (items: InventoryItem[]) => void) {
  if (!profileId) {
    callback([]);
    return () => {};
  }

  const supabase = createClient();

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("profile_id", profileId)
      .order("app_name", { ascending: true });

    if (error) {
      console.error("Error fetching inventory:", error.message);
      return;
    }
    callback(data as InventoryItem[]);
  };

  fetchInventory();

  const channel = supabase
    .channel(`inventory-${profileId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "inventory", filter: `profile_id=eq.${profileId}` },
      () => fetchInventory()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function addInventoryItem(item: Omit<InventoryItem, "id">) {
  const supabase = createClient();
  const { error } = await supabase.from("inventory").insert(item);
  if (error) throw error;
}

export async function updateInventoryItem(id: string, item: Partial<InventoryItem>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("inventory")
    .update(item)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("inventory").delete().eq("id", id);
  if (error) throw error;
}

export async function addInventoryItems(items: Omit<InventoryItem, "id">[]) {
  const supabase = createClient();
  const { error } = await supabase.from("inventory").insert(items);
  if (error) throw error;
}
