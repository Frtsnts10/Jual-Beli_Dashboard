"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
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
  created_at: string;
}

export async function getComplaintsAction(storeId: string): Promise<Complaint[]> {
  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("complaints")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function createComplaintAction(storeId: string, formData: FormData) {
  const customer_name = formData.get("customer_name") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const priority = (formData.get("priority") as string) || "medium";

  if (!customer_name || !title || !description) {
    return { error: "Customer, title, and description required" };
  }

  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("complaints")
    .insert([{ store_id: storeId, customer_name, title, description, priority, status: "pending" }])
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/complaints`);
  return { data };
}

export async function updateComplaintStatusAction(storeId: string, id: string, nextStatus: Complaint["status"]) {
  const adminSupabase = await createAdminSupabase();
  const { error } = await adminSupabase
    .from("complaints")
    .update({ status: nextStatus })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/complaints`);
  return { success: true };
}

export async function applyComplaintSatisfactionAction(storeId: string, id: string, outcome: string) {
  const adminSupabase = await createAdminSupabase();
  const { error } = await adminSupabase
    .from("complaints")
    .update({ 
      satisfaction_outcome: outcome,
      status: "resolved" // Auto advance status upon granting satisfaction mitigation
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/complaints`);
  return { success: true };
}

export async function deleteComplaintAction(storeId: string, id: string) {
  const adminSupabase = await createAdminSupabase();
  const { error } = await adminSupabase.from("complaints").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/complaints`);
  return { success: true };
}
