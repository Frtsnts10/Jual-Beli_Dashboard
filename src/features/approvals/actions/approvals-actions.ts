"use server";

import { adminDb, getUserProfile } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";
import { DraftRequest } from "../types";

export async function getPendingDraftsAction(storeId: string): Promise<DraftRequest[]> {
  const snap = await adminDb.collection("draft_requests")
    .where("store_id", "==", storeId)
    .where("status", "==", "PENDING")
    .get();

  const drafts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DraftRequest));
  return drafts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function approveDraftAction(storeId: string, draftId: string) {
  try {
    const userProfile = await getUserProfile();
    if (!userProfile || userProfile.role !== "admin") {
      return { error: "Only administrators can approve drafts." };
    }

    const draftRef = adminDb.collection("draft_requests").doc(draftId);
    const draftDoc = await draftRef.get();
    
    if (!draftDoc.exists) return { error: "Draft not found." };
    const draft = draftDoc.data() as DraftRequest;

    if (draft.status !== "PENDING") return { error: "Draft is not pending." };

    // Apply the change
    const targetRef = adminDb.collection(draft.target_collection).doc(draft.target_id || draft.payload.id);

    if (draft.type === "CREATE" || draft.type === "UPDATE") {
      await targetRef.set(draft.payload, { merge: true });
    } else if (draft.type === "DELETE") {
      await targetRef.delete();
    }

    // Mark as approved
    await draftRef.update({
      status: "APPROVED",
      updated_at: new Date().toISOString(),
    });

    revalidatePath(`/${storeId}/inventory`);
    revalidatePath(`/${storeId}/approvals`);
    revalidatePath(`/${storeId}/dashboard`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function rejectDraftAction(storeId: string, draftId: string, reason?: string) {
  try {
    const userProfile = await getUserProfile();
    if (!userProfile || userProfile.role !== "admin") {
      return { error: "Only administrators can reject drafts." };
    }

    const draftRef = adminDb.collection("draft_requests").doc(draftId);
    await draftRef.update({
      status: "REJECTED",
      rejection_reason: reason || "No reason provided",
      updated_at: new Date().toISOString(),
    });

    revalidatePath(`/${storeId}/approvals`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
