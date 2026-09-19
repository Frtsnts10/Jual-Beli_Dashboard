"use server";

import { adminDb, getUserProfile, verifyStoreAccess } from "@/lib/firebase/server";
import { DraftRequest } from "@/features/approvals/types";
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
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) throw new Error("Unauthorized access to store");

  const snap = await adminDb.collection("inventory")
    .where("store_id", "==", storeId)
    .get();

  const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
  return items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function createInventoryItemAction(storeId: string, formData: FormData) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

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

  if (!category) return { error: "Category is required" };
  if (!name) return { error: "Product Name is required" };

  const multiProfileTriggers = ["netflix", "disney", "prime", "hulu", "hbo", "google", "youtube", "canva", "spotify"];
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

  try {
    const userProfile = await getUserProfile();
    if (!userProfile) return { error: "Authentication required" };
    const isStaff = userProfile.role === "staff";

    const docRef = adminDb.collection("inventory").doc();
    const data = {
      id: docRef.id,
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
      created_at: new Date().toISOString(),
    };

    if (isStaff) {
      const draftRef = adminDb.collection("draft_requests").doc();
      const draft: DraftRequest = {
        id: draftRef.id,
        store_id: storeId,
        type: "CREATE",
        target_collection: "inventory",
        target_id: null,
        payload: data,
        status: "PENDING",
        proposed_by: {
          uid: userProfile.uid,
          name: userProfile.name,
          email: userProfile.email || "",
        },
        created_at: new Date().toISOString(),
      };
      await draftRef.set(draft);
      return { data, message: "Draft submitted for Admin approval" };
    } else {
      await docRef.set(data);
      revalidatePath(`/${storeId}/inventory`);
      revalidatePath(`/${storeId}/dashboard`);
      return { data };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateItemGroupingAction(storeId: string, itemId: string, nextGroup: string | null) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  try {
    await adminDb.collection("inventory").doc(itemId).update({ group_name: nextGroup || null });
    revalidatePath(`/${storeId}/inventory`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteInventoryItemAction(storeId: string, id: string) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  try {
    const userProfile = await getUserProfile();
    if (!userProfile) return { error: "Authentication required" };
    const isStaff = userProfile.role === "staff";

    if (isStaff) {
      const draftRef = adminDb.collection("draft_requests").doc();
      const draft: DraftRequest = {
        id: draftRef.id,
        store_id: storeId,
        type: "DELETE",
        target_collection: "inventory",
        target_id: id,
        payload: { id },
        status: "PENDING",
        proposed_by: {
          uid: userProfile.uid,
          name: userProfile.name,
          email: userProfile.email || "",
        },
        created_at: new Date().toISOString(),
      };
      await draftRef.set(draft);
      return { success: true, message: "Delete request submitted for Admin approval" };
    } else {
      await adminDb.collection("inventory").doc(id).delete();
      revalidatePath(`/${storeId}/inventory`);
      revalidatePath(`/${storeId}/dashboard`);
      return { success: true };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateInventoryItemAction(storeId: string, itemId: string, formData: FormData) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

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
  const group_name = (formData.get("group_name") as string) || null;

  if (!category) return { error: "Category is required" };
  if (!name) return { error: "Product Name is required" };

  try {
    const userProfile = await getUserProfile();
    if (!userProfile) return { error: "Authentication required" };
    const isStaff = userProfile.role === "staff";

    const payload = {
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

    if (isStaff) {
      const draftRef = adminDb.collection("draft_requests").doc();
      const draft: DraftRequest = {
        id: draftRef.id,
        store_id: storeId,
        type: "UPDATE",
        target_collection: "inventory",
        target_id: itemId,
        payload,
        status: "PENDING",
        proposed_by: {
          uid: userProfile.uid,
          name: userProfile.name,
          email: userProfile.email || "",
        },
        created_at: new Date().toISOString(),
      };
      await draftRef.set(draft);
      return { data: { id: itemId }, message: "Update requested as Draft" };
    } else {
      await adminDb.collection("inventory").doc(itemId).update(payload);
      revalidatePath(`/${storeId}/inventory`);
      revalidatePath(`/${storeId}/dashboard`);
      return { data: { id: itemId } };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function importInventoryCsvAction(storeId: string, rows: any[]) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  const userProfile = await getUserProfile();
  if (!userProfile) return { error: "Authentication required" };
  if (userProfile.role === "staff") return { error: "Staff members cannot perform bulk CSV imports at this time." };

  const multiProfileTriggers = ["netflix", "disney", "prime", "hulu", "hbo", "google", "youtube", "canva", "spotify"];
  const batch = adminDb.batch();

  const inserts: any[] = [];

  rows.forEach((row) => {
    // Check if this is a Master Account CSV format
    if (row.Provider && row.Total_Slots) {
      const provider = row.Provider || "Unknown Provider";
      const totalSlots = parseInt(row.Total_Slots, 10) || 1;
      const accountType = row.Account_Type || "Standard";
      const email = row.Email || null;
      const password = row.Password || null;
      const profilesStr = row.Profiles || "";
      const profilesArray = profilesStr.split(/[,;]/).map((p: string) => p.trim()).filter((p: string) => p !== "");
      
      const groupName = `${provider} ${accountType} Pool — ${email?.toLowerCase().trim() || 'Unknown'}`;
      
      for (let i = 0; i < totalSlots; i++) {
        const docRef = adminDb.collection("inventory").doc();
        const profileName = profilesArray[i] || null; // Unassigned if null
        
        const data = {
          id: docRef.id,
          store_id: storeId,
          name: `${provider} 1 User`.trim(),
          profile_tier: accountType,
          profile_name: profileName,
          email,
          password,
          pin: null,
          base_price: 0,
          selling_price: 0,
          price: 0,
          stock: profileName ? 0 : 1, // If assigned to someone, stock is 0. If empty, stock is 1.
          date_buy: new Date().toLocaleDateString('en-CA'),
          date_expired: null,
          category: "Shared Account",
          group_name: groupName,
          created_at: new Date().toISOString(),
        };
        batch.set(docRef, data);
        inserts.push(data);
      }
    } else {
      // Standard Direct SKU Format
      const name = row.name || "Unnamed Asset";
      const profile_tier = row.profile_tier || null;
      const email = row.email || null;
      const date_expired = row.date_expired || null;
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

      const docRef = adminDb.collection("inventory").doc();
      const data = {
        id: docRef.id,
        store_id: storeId,
        name,
        profile_tier,
        profile_name: row.profile_name || null,
        email,
        password: row.password || null,
        pin: row.pin || null,
        base_price: parseFloat(row.base_price) || 0,
        selling_price: parseFloat(row.selling_price) || 0,
        price: parseFloat(row.selling_price) || 0,
        stock: parseInt(row.stock, 10) || 1,
        date_buy: row.date_buy || null,
        date_expired,
        category: row.category || null,
        group_name,
        created_at: new Date().toISOString(),
      };
      batch.set(docRef, data);
      inserts.push(data);
    }
  });

  if (inserts.length === 0) return { error: "No valid rows found to import" };

  try {
    await batch.commit();
    revalidatePath(`/${storeId}/inventory`);
    revalidatePath(`/${storeId}/dashboard`);
    return { success: true, count: inserts.length };
  } catch (err: any) {
    return { error: err.message };
  }
}
