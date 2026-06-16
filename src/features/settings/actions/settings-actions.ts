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

export async function updateStoreApiKeysAction(storeId: string, formData: FormData) {
  const midtransServerKey = formData.get("midtrans_server_key") as string;
  const midtransClientKey = formData.get("midtrans_client_key") as string;

  try {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("Unauthorized");

    const storeRef = adminDb.collection("stores").doc(storeId);
    const doc = await storeRef.get();
    if (!doc.exists) throw new Error("Workspace not found");

    if (doc.data()?.owner_id !== user.uid) {
      throw new Error("Only the owner can modify API configurations");
    }

    const updates: any = {};
    updates["api_keys.midtrans_server_key"] = midtransServerKey || "";
    updates["api_keys.midtrans_client_key"] = midtransClientKey || "";

    await storeRef.update(updates);

    revalidatePath("/", "layout");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to save API keys configuration." };
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
