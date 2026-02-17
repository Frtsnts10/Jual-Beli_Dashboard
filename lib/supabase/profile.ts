import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  updated_at: string;
};

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);

    return null;
  }

  return data as Profile;
}

export async function updateProfile(
  profile: Partial<Profile> & { id: string },
) {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").upsert({
    ...profile,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function uploadAvatar(file: File, userId: string) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

  return data.publicUrl;
}
