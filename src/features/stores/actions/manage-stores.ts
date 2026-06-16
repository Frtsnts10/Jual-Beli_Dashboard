"use server";

import { adminDb, getAuthenticatedUser } from "@/lib/firebase/server";
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

    // Check store count and plan
    const subsSnap = await adminDb.collection("subscriptions")
      .where("profile_id", "==", profileId)
      .limit(1)
      .get();
    const sub = subsSnap.empty ? null : subsSnap.docs[0].data();

    const maxStores = (sub?.plan === "pro" || sub?.plan === "plus") ? Infinity : 3;
    if (count >= maxStores) {
      throw new Error(`Upgrade your plan to add more stores.`);
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
  } catch (err: any) {
    return { error: err.message || "Failed to provision workspace partition." };
  }
}
