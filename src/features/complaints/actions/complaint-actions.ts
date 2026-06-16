"use server";

import { adminDb, getAuthenticatedUser } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export interface Complaint {
  id: string;
  store_id: string;
  customer_name: string;
  title: string;
  description: string;
  status: "pending" | "investigating" | "resolved";
  priority: "low" | "medium" | "high";
  satisfaction_outcome?: string | null;
  refund_amount?: number | null;
  refund_status?: "none" | "processing" | "completed" | "failed";
  created_at: string;
}

export async function getComplaintsAction(storeId: string): Promise<Complaint[]> {
  const snap = await adminDb.collection("complaints")
    .where("store_id", "==", storeId)
    .orderBy("created_at", "desc")
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
}

export async function createComplaintAction(storeId: string, formData: FormData) {
  const customer_name = formData.get("customer_name") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as string) || "medium";

  if (!customer_name || !title || !description) {
    return { error: "Customer, title, and description required" };
  }

  try {
    const docRef = adminDb.collection("complaints").doc();
    const data = {
      id: docRef.id,
      store_id: storeId,
      customer_name,
      title,
      description,
      priority,
      status: "pending",
      satisfaction_outcome: null,
      refund_amount: null,
      refund_status: "none",
      created_at: new Date().toISOString(),
    };
    await docRef.set(data);

    revalidatePath(`/${storeId}/complaints`);
    return { data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateComplaintStatusAction(storeId: string, id: string, nextStatus: Complaint["status"]) {
  try {
    await adminDb.collection("complaints").doc(id).update({ status: nextStatus });
    revalidatePath(`/${storeId}/complaints`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function applyComplaintSatisfactionAction(storeId: string, id: string, outcome: string) {
  try {
    await adminDb.collection("complaints").doc(id).update({
      satisfaction_outcome: outcome,
      status: "resolved",
    });
    revalidatePath(`/${storeId}/complaints`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function processComplaintRefundAction(storeId: string, id: string, amount: number) {
  try {
    // In a real app, you would integrate Stripe/PayPal API here
    // e.g., const refund = await stripe.refunds.create({ charge: 'ch_123', amount: amount * 100 });
    
    await adminDb.collection("complaints").doc(id).update({
      satisfaction_outcome: `Refund Granted: $${amount}`,
      status: "resolved",
      refund_amount: amount,
      refund_status: "completed",
    });
    
    revalidatePath(`/${storeId}/complaints`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function deleteComplaintAction(storeId: string, id: string) {
  try {
    await adminDb.collection("complaints").doc(id).delete();
    revalidatePath(`/${storeId}/complaints`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
