"use server";

import { createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateStoreSettingsAction(storeId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const logo_url = formData.get("logo_url") as string;
  const currency = formData.get("currency") as string;
  const email = formData.get("email") as string;
  const instagram = formData.get("instagram") as string;
  const whatsapp = formData.get("whatsapp") as string;

  if (!name) return { error: "Store name required" };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const supabase = await createAdminSupabase();
  const { error } = await supabase
    .from("stores")
    .update({ 
      name, 
      slug,
      ...(logo_url !== null && { logo_url }),
      ...(currency && { currency }),
      email,
      instagram,
      whatsapp
    })
    .eq("id", storeId);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/dashboard`);
  revalidatePath(`/${storeId}/settings`);
  return { success: true };
}

export async function deleteStoreAction(storeId: string) {
  const supabase = await createAdminSupabase();
  const { error } = await supabase.from("stores").delete().eq("id", storeId);

  if (error) return { error: error.message };

  revalidatePath("/");
  redirect("/dashboard");
}
