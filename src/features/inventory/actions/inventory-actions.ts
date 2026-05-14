"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface InventoryItem {
  id: string;
  store_id: string;
  name: string;
  profile_tier: string | null;
  profile_name: string | null;
  email: string | null;
  password: string | null;
  pin: string | null;
  base_price: number;
  selling_price: number;
  price: number;
  stock: number;
  date_buy: string | null;
  date_expired: string | null;
  category: string | null;
  group_name?: string | null;
  created_at: string;
}

export async function getInventoryAction(storeId: string): Promise<InventoryItem[]> {
  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("inventory")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function createInventoryItemAction(storeId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const profile_tier = (formData.get("profile_tier") as string) || null;
  const profile_name = (formData.get("profile_name") as string) || null;
  const email = (formData.get("email") as string) || null;
  const password = (formData.get("password") as string) || null;
  const pin = (formData.get("pin") as string) || null;
  const base_price = parseFloat(formData.get("base_price") as string) || 0;
  const selling_price = parseFloat(formData.get("selling_price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string, 10) || 1;
  const date_buy = (formData.get("date_buy") as string) || null;
  const date_expired = (formData.get("date_expired") as string) || null;
  const category = (formData.get("category") as string) || null;
  let group_name = (formData.get("group_name") as string) || null;

  if (!name) return { error: "Product Name is required" };

  const multiProfileTriggers = ["netflix", "disney", "prime", "hulu", "hbo", "google", "youtube", "canva", "spotify"];
  const isMultiProfile = multiProfileTriggers.some((t) => name.toLowerCase().includes(t));

  // Automatically group streaming sub-profiles belonging to the same root email address into a shared account pool
  if (isMultiProfile && !group_name) {
    const baseAlias = name.split(" ")[0];
    if (email) {
      group_name = `${baseAlias} Master Account Pool — ${email.toLowerCase().trim()}`;
    } else {
      const durationToken = date_expired ? `Exp-${date_expired}` : "RollingPool";
      const tierToken = profile_tier || "1u";
      group_name = `${baseAlias} Shared Hub [${tierToken}] — ${durationToken}`;
    }
  }

  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("inventory")
    .insert([
      {
        store_id: storeId,
        name,
        profile_tier,
        profile_name,
        email,
        password,
        pin,
        base_price,
        selling_price,
        price: selling_price, // map fallback metric
        stock,
        date_buy,
        date_expired,
        category,
        group_name,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { data };
}

export async function updateItemGroupingAction(storeId: string, itemId: string, nextGroup: string | null) {
  const adminSupabase = await createAdminSupabase();
  const { error } = await adminSupabase
    .from("inventory")
    .update({ group_name: nextGroup || null })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/inventory`);
  return { success: true };
}

export async function deleteInventoryItemAction(storeId: string, id: string) {
  const adminSupabase = await createAdminSupabase();
  const { error } = await adminSupabase.from("inventory").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function updateInventoryItemAction(storeId: string, itemId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const profile_tier = (formData.get("profile_tier") as string) || null;
  const profile_name = (formData.get("profile_name") as string) || null;
  const email = (formData.get("email") as string) || null;
  const password = (formData.get("password") as string) || null;
  const pin = (formData.get("pin") as string) || null;
  const base_price = parseFloat(formData.get("base_price") as string) || 0;
  const selling_price = parseFloat(formData.get("selling_price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string, 10) || 1;
  const date_buy = (formData.get("date_buy") as string) || null;
  const date_expired = (formData.get("date_expired") as string) || null;
  const group_name = (formData.get("group_name") as string) || null;

  if (!name) return { error: "Product Name is required" };

  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("inventory")
    .update({
      name,
      profile_tier,
      profile_name,
      email,
      password,
      pin,
      base_price,
      selling_price,
      price: selling_price,
      stock,
      date_buy,
      date_expired,
      group_name,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { data };
}

export async function importInventoryCsvAction(storeId: string, rows: any[]) {
  const adminSupabase = await createAdminSupabase();
  const multiProfileTriggers = ["netflix", "disney", "prime", "hulu", "hbo", "google", "youtube", "canva", "spotify"];

  const inserts = rows.map((row) => {
    const name = row.name || "Unnamed Asset";
    const profile_tier = row.profile_tier || null;
    const profile_name = row.profile_name || null;
    const email = row.email || null;
    const password = row.password || null;
    const pin = row.pin || null;
    const base_price = parseFloat(row.base_price) || 0;
    const selling_price = parseFloat(row.selling_price) || 0;
    const stock = parseInt(row.stock, 10) || 1;
    const date_buy = row.date_buy || null;
    const date_expired = row.date_expired || null;
    const category = row.category || null;
    let group_name = row.group_name || null;

    const isMultiProfile = multiProfileTriggers.some((t) => name.toLowerCase().includes(t));
    if (isMultiProfile && !group_name) {
      const baseAlias = name.split(" ")[0];
      if (email) {
        group_name = `${baseAlias} Master Account Pool — ${email.toLowerCase().trim()}`;
      } else {
        const durationToken = date_expired ? `Exp-${date_expired}` : "RollingPool";
        const tierToken = profile_tier || "1u";
        group_name = `${baseAlias} Shared Hub [${tierToken}] — ${durationToken}`;
      }
    }

    return {
      store_id: storeId,
      name,
      profile_tier,
      profile_name,
      email,
      password,
      pin,
      base_price,
      selling_price,
      price: selling_price,
      stock,
      date_buy,
      date_expired,
      category,
      group_name,
    };
  });

  if (inserts.length === 0) return { error: "No valid rows found to import" };

  const { error } = await adminSupabase.from("inventory").insert(inserts);
  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true, count: inserts.length };
}
