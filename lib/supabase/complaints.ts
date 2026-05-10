import { createClient } from "@/lib/supabase/client";

export type ComplaintStatus = "open" | "in_progress" | "resolved";

export type Complaint = {
  id: string;
  profile_id: string;
  created_at: string;
  customer_name: string;
  whatsapp_number: string;
  product_name: string;
  complaint_text: string;
  status: ComplaintStatus;
  seller_notes: string | null;
  resolved_at: string | null;
};

export function subscribeToComplaints(
  profileId: string | undefined,
  callback: (items: Complaint[]) => void
) {
  if (!profileId) {
    callback([]);
    return () => {};
  }

  const supabase = createClient();

  const fetch = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false });
    if (error) { console.error("complaints fetch:", error.message); return; }
    callback(data as Complaint[]);
  };

  fetch();

  const channel = supabase
    .channel(`complaints-${profileId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "complaints",
      filter: `profile_id=eq.${profileId}`,
    }, fetch)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function addComplaint(item: Omit<Complaint, "id" | "created_at" | "resolved_at">) {
  const supabase = createClient();
  const { error } = await supabase.from("complaints").insert(item);
  if (error) throw error;
}

export async function updateComplaint(id: string, data: Partial<Complaint>) {
  const supabase = createClient();
  const { error } = await supabase.from("complaints").update(data).eq("id", id);
  if (error) throw error;
}

export async function deleteComplaint(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("complaints").delete().eq("id", id);
  if (error) throw error;
}
