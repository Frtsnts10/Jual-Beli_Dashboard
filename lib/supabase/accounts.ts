import { createClient } from "@/lib/supabase/client";

export type Account = {
  id: string;
  created_at: string;
  name: string; // App Name (Netflix, etc)
  email: string | null;
  password: string | null;
  status: "Ready" | "Sold" | "Expired";
  expiry_date: string | null;
  price: number | null;
  buyer_name: string | null; // Customer Name
  buyer_wa: string | null; // Phone Number
  notes: string | null;
  duration: string | null; // e.g. 1 Bulan
  plan: string | null; // e.g. 1 User, 2 Users
  order_date: string | null; // Timestamp
  received_date: string | null; // Timestamp
  device_type: string | null; // Can be multiple
};

export function subscribeToAccounts(callback: (accounts: Account[]) => void) {
  const supabase = createClient();

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching accounts:", error.message, error.details, error.hint);
      return;
    }
    callback(data as Account[]);
  };

  fetchAccounts();

  const channel = supabase
    .channel("accounts-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "accounts" },
      () => fetchAccounts()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function getAccounts(): Promise<Account[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Account[];
}

export async function addAccount(
  account: Omit<Account, "id" | "created_at">
) {
  const supabase = createClient();
  const { error } = await supabase.from("accounts").insert(account);
  if (error) throw error;
}

export async function updateAccount(id: string, account: Partial<Account>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("accounts")
    .update(account)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAccount(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}
export async function addAccounts(
  accounts: Omit<Account, "id" | "created_at">[]
) {
  const supabase = createClient();
  const { error } = await supabase.from("accounts").insert(accounts);
  if (error) throw error;
}
