"use server";

import { adminDb } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  created_at: string;
}

export async function getProfileByUserId(userId: string) {
  const doc = await adminDb.collection("profiles").doc(userId).get();
  if (!doc.exists) {
    throw new Error("Profile not found");
  }
  return { id: doc.id, ...doc.data() };
}

export async function createStoreAction(profileId: string, formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { error: "Store name is required" };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  try {
    // Resolve current mapped store count
    const storesSnap = await adminDb.collection("stores")
      .where("owner_id", "==", profileId)
      .get();
    const count = storesSnap.size;

    const { getSubscriptionStatus } = await import("@/features/subscription/server/subscription-actions");
    const subscription = await getSubscriptionStatus();
    
    const maxStores = 
      subscription.interval === "lifetime" ? Infinity :
      subscription.interval === "yearly" ? 15 :
      subscription.interval === "monthly" ? 8 :
      subscription.interval === "weekly" ? 5 :
      3;

    if (count >= maxStores) {
      throw new Error(`Upgrade your plan to add more stores. Maximum ${maxStores} allowed.`);
    }

    // Ensure the parent profile row exists
    const profileRef = adminDb.collection("profiles").doc(profileId);
    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      await profileRef.set({
        id: profileId,
        email: "owner@premium-console.dev",
        full_name: "Verified Store Owner",
        is_premium: false,
        created_at: new Date().toISOString(),
      });
    }

    const storeRef = adminDb.collection("stores").doc();
    const storeData = {
      id: storeRef.id,
      owner_id: profileId,
      name,
      slug,
      logo_url: null,
      currency: "IDR",
      email: "support@yourdomain.com",
      instagram: "",
      whatsapp: "",
      created_at: new Date().toISOString(),
    };
    await storeRef.set(storeData);

    revalidatePath("/", "layout");
    return { data: storeData };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message || "Failed to provision workspace partition." };
    }
    return { error: "Failed to provision workspace partition." };
  }
}
