"use server";

import { adminDb } from "@/lib/firebase/server";
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

  try {
    const updateData: Record<string, any> = { name, slug, email, instagram, whatsapp };
    if (logo_url !== null) updateData.logo_url = logo_url;
    if (currency) updateData.currency = currency;

    await adminDb.collection("stores").doc(storeId).update(updateData);

    revalidatePath(`/${storeId}/dashboard`);
    revalidatePath(`/${storeId}/settings`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteStoreAction(storeId: string) {
  try {
    await adminDb.collection("stores").doc(storeId).delete();
    revalidatePath("/");
    redirect("/dashboard");
  } catch (err: any) {
    return { error: err.message };
  }
}
