"use server";

import { createServerSupabase, createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PurchasedProduct {
  name: string;
  variant: string;
  duration_days: number;
  bought_date: string; // Real-time submission ISO Timestamp
  expire_date: string; // Explicit or Auto-summed ISO Timestamp
  date_start?: string; // Streaming Start Date ISO string
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  purchased_products: PurchasedProduct[];
  total_orders: number;
  created_at: string;
}

export async function getCustomersAction(storeId: string): Promise<Customer[]> {
  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("customers")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  // Normalize JSON arrays securely
  return (data || []).map((c: any) => ({
    ...c,
    purchased_products: Array.isArray(c.purchased_products) ? c.purchased_products : [],
  }));
}

export async function createCustomerAction(storeId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;

  // Embedded optional initial product purchase
  const product_name = formData.get("product_name") as string;
  const product_variant = (formData.get("product_variant") as string) || "1user";
  const duration_days = parseInt(formData.get("duration_days") as string, 10) || 30;
  const date_start_input = formData.get("date_start") as string;
  const date_end_input = formData.get("date_end") as string;

  if (!name) return { error: "Customer name required" };

  const purchased_products: PurchasedProduct[] = [];
  let total_orders = 0;

  if (product_name) {
    total_orders = 1;
    const now = new Date();
    const startDateObj = date_start_input ? new Date(date_start_input) : now;
    const expireDateObj = date_end_input 
      ? new Date(date_end_input) 
      : new Date(startDateObj.getTime() + duration_days * 24 * 60 * 60 * 1000);

    purchased_products.push({
      name: product_name,
      variant: product_variant,
      duration_days,
      bought_date: now.toISOString(), // Captured timestamp at creation
      date_start: startDateObj.toISOString(),
      expire_date: expireDateObj.toISOString(),
    });
  }

  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("customers")
    .insert([
      {
        store_id: storeId,
        name,
        email,
        phone,
        purchased_products,
        total_orders,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { data };
}

export async function appendCustomerProductAction(
  storeId: string,
  customerId: string,
  product: { name: string; variant: string; duration_days: number; bought_date?: string; date_start?: string; expire_date?: string }
) {
  const adminSupabase = await createAdminSupabase();
  // Fetch existing products array
  const { data: customer, error: fetchErr } = await adminSupabase
    .from("customers")
    .select("purchased_products, total_orders")
    .eq("id", customerId)
    .single();

  if (fetchErr || !customer) return { error: "Customer context missing" };

  const existingProducts = Array.isArray(customer.purchased_products) ? customer.purchased_products : [];
  const now = new Date();
  const startDateObj = product.date_start ? new Date(product.date_start) : now;
  const expireDateObj = product.expire_date 
    ? new Date(product.expire_date) 
    : new Date(startDateObj.getTime() + product.duration_days * 24 * 60 * 60 * 1000);

  const updatedProducts = [
    ...existingProducts,
    {
      name: product.name,
      variant: product.variant,
      duration_days: product.duration_days,
      bought_date: product.bought_date || now.toISOString(),
      date_start: startDateObj.toISOString(),
      expire_date: expireDateObj.toISOString(),
    },
  ];

  const { error: updateErr } = await adminSupabase
    .from("customers")
    .update({
      purchased_products: updatedProducts,
      total_orders: customer.total_orders + 1,
    })
    .eq("id", customerId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function deleteCustomerAction(storeId: string, id: string) {
  const adminSupabase = await createAdminSupabase();
  const { error } = await adminSupabase.from("customers").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function removeCustomerProductAction(storeId: string, customerId: string, productIndex: number) {
  const adminSupabase = await createAdminSupabase();
  const { data: customer } = await adminSupabase
    .from("customers")
    .select("purchased_products, total_orders")
    .eq("id", customerId)
    .single();

  if (!customer) return { error: "Customer context missing" };
  const products = Array.isArray(customer.purchased_products) ? [...customer.purchased_products] : [];
  if (productIndex < 0 || productIndex >= products.length) return { error: "Invalid product target" };

  const targetItem = products[productIndex];
  products.splice(productIndex, 1);

  if (targetItem?.inventory_id) {
    await adminSupabase
      .from("inventory")
      .update({ profile_name: null })
      .eq("id", targetItem.inventory_id);
  }

  const { error: updateErr } = await adminSupabase
    .from("customers")
    .update({
      purchased_products: products,
      total_orders: Math.max(0, customer.total_orders - 1),
    })
    .eq("id", customerId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function extendCustomerProductAction(storeId: string, customerId: string, productIndex: number, addedDays: number) {
  const adminSupabase = await createAdminSupabase();
  const { data: customer } = await adminSupabase
    .from("customers")
    .select("purchased_products")
    .eq("id", customerId)
    .single();

  if (!customer) return { error: "Customer context missing" };
  const products = Array.isArray(customer.purchased_products) ? [...customer.purchased_products] : [];
  if (productIndex < 0 || productIndex >= products.length) return { error: "Invalid product target" };

  const target = products[productIndex];
  const currentExp = target.expire_date ? new Date(target.expire_date) : new Date();
  const nextExp = new Date(currentExp.getTime() + addedDays * 86400000);

  target.duration_days = (target.duration_days || 0) + addedDays;
  target.expire_date = nextExp.toISOString();
  if (target.status === "banned") {
    delete target.status;
  }

  if (target.inventory_id) {
    await adminSupabase
      .from("inventory")
      .update({ date_expired: nextExp.toISOString() })
      .eq("id", target.inventory_id);
  }

  const { error: updateErr } = await adminSupabase
    .from("customers")
    .update({ purchased_products: products })
    .eq("id", customerId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function banCustomerProductAction(storeId: string, customerId: string, productIndex: number, banReason?: string) {
  const adminSupabase = await createAdminSupabase();
  const { data: customer } = await adminSupabase
    .from("customers")
    .select("purchased_products")
    .eq("id", customerId)
    .single();

  if (!customer) return { error: "Customer context missing" };
  const products = Array.isArray(customer.purchased_products) ? [...customer.purchased_products] : [];
  if (productIndex < 0 || productIndex >= products.length) return { error: "Invalid product target" };

  products[productIndex].status = "banned";
  (products[productIndex] as any).banned_reason = banReason || "Violation of workspace integrity parameters";

  const { error: updateErr } = await adminSupabase
    .from("customers")
    .update({ purchased_products: products })
    .eq("id", customerId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export interface AllocationOrderInput {
  storeId: string;
  customerId: string;
  customerName: string;
  productName: string;         // e.g., "Netflix"
  profileTier: string;         // e.g., "1user"
  durationDays: number;        // e.g., 30 or 28
}

export async function createAndAllocateCustomerOrderAction(input: AllocationOrderInput) {
  const adminSupabase = await createAdminSupabase();
  const now = new Date();
  const expireDate = new Date(now.getTime() + input.durationDays * 86400000);

  // 1. AUTO-PICKER: Find any unassigned inventory asset matching product name + profile tier
  const { data: availableAssets, error: assetErr } = await adminSupabase
    .from("inventory")
    .select("*")
    .eq("store_id", input.storeId)
    .ilike("name", input.productName)
    .eq("profile_tier", input.profileTier)
    .filter("profile_name", "is", null) // ensure unassigned slot
    .limit(1);

  if (assetErr || !availableAssets || availableAssets.length === 0) {
    return { error: `Zero unassigned inventory items available for '${input.productName} (${input.profileTier})'. Please restock digital warehouse inventory.` };
  }

  const selectedAsset = availableAssets[0];

  // 2. COMPILE GROUP PREFIX BY DURATION
  // Base pattern ensures separate buckets for separate durations
  const groupPrefixMatch = `${input.productName} - ${input.profileTier} - ${input.durationDays}Days`;

  // 3. RETRIEVE ALL ACTIVE SLOTS IN SIMILAR POOLS
  const { data: siblingAssets } = await adminSupabase
    .from("inventory")
    .select("group_name, created_at")
    .eq("store_id", input.storeId)
    .ilike("group_name", `${groupPrefixMatch}%`);

  // Analyze active group indices to find an unfilled pool (capacity < 6)
  const groupCounts: Record<string, number> = {};
  const activeSiblingList = siblingAssets || [];
  
  activeSiblingList.forEach((item) => {
    if (item.group_name) {
      groupCounts[item.group_name] = (groupCounts[item.group_name] || 0) + 1;
    }
  });

  let assignedGroupName = "";
  let isGroupOwner = false;

  // Search through established groups for one with space available
  for (const [gName, count] of Object.entries(groupCounts)) {
    if (count < 6) {
      assignedGroupName = gName;
      break;
    }
  }

  // Provision a new Group Bucket if all active pools are completely full
  if (!assignedGroupName) {
    // Determine highest active integer bucket sequence index
    let maxIdx = 0;
    Object.keys(groupCounts).forEach((gName) => {
      const match = gName.match(/\(Group #(\d+)\)/);
      if (match && match[1]) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    });
    
    const nextIdx = maxIdx + 1;
    assignedGroupName = `${groupPrefixMatch} (Group #${nextIdx})`;
    // Since this is a fresh bucket, this customer slot acts as the Owner
    isGroupOwner = true;
  }

  // 4. ATTACH THE SPECIFIED SLOT TO THE CUSTOMER & TARGET BUCKET
  const { error: updateInvErr } = await adminSupabase
    .from("inventory")
    .update({
      profile_name: input.customerName,
      group_name: assignedGroupName,
      date_buy: now.toISOString(),
      date_expired: expireDate.toISOString(),
    })
    .eq("id", selectedAsset.id);

  if (updateInvErr) return { error: "Failed to persist slot allocation to memory." };

  // 5. APPEND RECORD TO CUSTOMER'S PURCHASED PRODUCTS LIST
  const { data: customer } = await adminSupabase
    .from("customers")
    .select("purchased_products, total_orders")
    .eq("id", input.customerId)
    .single();

  if (customer) {
    const existingProducts = Array.isArray(customer.purchased_products) ? customer.purchased_products : [];
    const appendedProducts = [
      ...existingProducts,
      {
        name: input.productName,
        variant: input.profileTier,
        duration_days: input.durationDays,
        bought_date: now.toISOString(),
        expire_date: expireDate.toISOString(),
        group_assigned: assignedGroupName,
        is_owner: isGroupOwner, // Special handling identifier for Group Master
        inventory_id: selectedAsset.id,
      },
    ];

    await adminSupabase
      .from("customers")
      .update({
        purchased_products: appendedProducts,
        total_orders: customer.total_orders + 1,
      })
      .eq("id", input.customerId);
  }

  revalidatePath(`/${input.storeId}/customers`);
  revalidatePath(`/${input.storeId}/inventory`);
  return { success: true, allocatedGroupName: assignedGroupName, isOwner: isGroupOwner };
}

export async function importCustomersCsvAction(storeId: string, rows: any[]) {
  const adminSupabase = await createAdminSupabase();
  const inserts = rows.map((row) => {
    const name = row.name || "Unnamed Customer";
    const email = row.email || null;
    const phone = row.phone || null;
    const purchased_products: any[] = [];
    let total_orders = 0;

    if (row.product_name) {
      total_orders = 1;
      const duration_days = parseInt(row.duration_days, 10) || 30;
      const now = new Date();
      const bought_date = row.bought_date ? new Date(row.bought_date) : now;
      const startObj = bought_date;
      const expireObj = new Date(startObj.getTime() + duration_days * 86400000);

      purchased_products.push({
        name: row.product_name,
        variant: row.product_variant || "1user",
        duration_days,
        bought_date: bought_date.toISOString(),
        date_start: startObj.toISOString(),
        expire_date: expireObj.toISOString(),
      });
    }

    return {
      store_id: storeId,
      name,
      email,
      phone,
      purchased_products,
      total_orders,
    };
  });

  if (inserts.length === 0) return { error: "No valid rows found to import" };

  const { error } = await adminSupabase.from("customers").insert(inserts);
  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true, count: inserts.length };
}
