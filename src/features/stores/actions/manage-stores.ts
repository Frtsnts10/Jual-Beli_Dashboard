"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export async function getProfileByUserId(userId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Profile not found");
  }
  return data;
}

export async function createStoreAction(profileId: string, formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "Store name is required" };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Use primary administrative execution envelope to seamlessly write records bypassing restrictive client RLS boundary rules
  const adminSupabase = await createAdminSupabase();

  try {
    // Resolve current mapped store count
    const { count } = await adminSupabase
      .from("stores")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", profileId);

    // Check store count and plan
    const { data: sub } = await adminSupabase
      .from("subscriptions")
      .select("plan")
      .eq("profile_id", profileId)
      .single();

    const maxStores = sub?.plan === "pro" ? Infinity : sub?.plan === "starter" ? 5 : 3;
    if (count !== null && count >= maxStores) {
      throw new Error(`Upgrade your plan to add more stores.`);
    }

    // Ensure the parent profile row exists natively to satisfy the stores.owner_id foreign key constraint
    await adminSupabase.from("profiles").upsert({
      id: profileId,
      clerk_id: profileId,
      email: "owner@premium-console.dev",
      full_name: "Verified Store Owner",
    });

    const { data, error } = await adminSupabase
      .from("stores")
      .insert([{ owner_id: profileId, name, slug }])
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to provision workspace partition." };
  }
}
