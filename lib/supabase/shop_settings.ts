import { createClient } from "@/lib/supabase/client";

export interface ShopSettings {
  id: string;
  shop_name: string;
  whatsapp_number: string;
  currency: string;
}

export const createShop = async (settings: Omit<ShopSettings, "id">) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .insert([settings])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateShopSettings = async (id: string, settings: Partial<ShopSettings>) => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(settings)
    .eq("id", id);

  if (error) throw error;
  return data;
};

export const deleteShop = async (id: string) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;
};
