import { createClient } from "@/lib/supabase/client";

export type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  user_id: string;
};

export function subscribeToProducts(callback: (products: Product[]) => void) {
  const supabase = createClient();

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", JSON.stringify(error, null, 2));
      console.error("Supabase error details:", error);

      return;
    }
    callback(data as Product[]);
  };

  fetchProducts();

  const channel = supabase
    .channel("schema-db-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
      },
      (payload) => {
        fetchProducts();
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function addProduct(product: Omit<Product, "id" | "user_id">) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase.from("products").insert({
    ...product,
    user_id: user.id,
  });

  if (error) throw error;
}

export async function updateProduct(id: string, product: Partial<Product>) {
  const supabase = createClient();
  const { error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteProduct(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) throw error;
}

export async function uploadProductImage(file: File) {
  const supabase = createClient();
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("products")
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("products").getPublicUrl(filePath);

  return data.publicUrl;
}
