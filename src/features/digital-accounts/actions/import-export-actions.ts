"use server";

import { adminDb } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export async function importDigitalAccountsAction(storeId: string, data: any[]) {
  try {
    const batch = adminDb.batch();

    for (const row of data) {
      if (!row.Email || !row.Provider) continue; // Skip invalid rows

      const accountRef = adminDb.collection("digital_accounts").doc();
      
      const profilesStr = row.Profiles || "";
      const profilesArray = profilesStr.split(",").map((p: string) => p.trim()).filter((p: string) => p !== "");
      
      batch.set(accountRef, {
        store_id: storeId,
        provider: row.Provider,
        email: row.Email,
        password: row.Password || "",
        account_type: row.Account_Type || "Unknown",
        total_profiles: parseInt(row.Total_Slots) || 5,
        profiles: profilesArray,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await batch.commit();
    revalidatePath(`/${storeId}/digital-accounts`);
    return { success: true, message: `Successfully imported ${data.length} accounts!` };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getDigitalAccountsAction(storeId: string) {
  try {
    const snap = await adminDb.collection("digital_accounts")
      .where("store_id", "==", storeId)
      .orderBy("created_at", "desc")
      .get();
      
    return { accounts: snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  } catch (err: any) {
    return { error: err.message };
  }
}
