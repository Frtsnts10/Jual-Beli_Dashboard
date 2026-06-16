"use server";

import { adminDb } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateStoreSettingsAction(storeId: string, formData: FormData) {
  const name = formData.get("name") as string | null;
  const logo_url = formData.get("logo_url") as string | null;
  const currency = formData.get("currency") as string | null;
  const email = formData.get("email") as string | null;
  const instagram = formData.get("instagram") as string | null;
  const whatsapp = formData.get("whatsapp") as string | null;

  try {
    const updateData: Record<string, any> = {};
    if (name !== null) {
      if (!name.trim()) return { error: "Store name required" };
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (logo_url !== null) updateData.logo_url = logo_url;
    if (currency !== null) updateData.currency = currency;
    if (email !== null) updateData.email = email;
    if (instagram !== null) updateData.instagram = instagram;
    if (whatsapp !== null) updateData.whatsapp = whatsapp;

    if (Object.keys(updateData).length > 0) {
      await adminDb.collection("stores").doc(storeId).update(updateData);
    }

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
