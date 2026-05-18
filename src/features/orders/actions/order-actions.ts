"use server";

import { createAdminSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface OrderItem {
  name: string;
  variant: string;
  duration_days: number;
  price?: number;
  bought_date?: string;
  expire_date?: string;
  inventory_id?: string; // Linked inventory item after allocation
}

export interface Order {
  id: string;
  store_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total_amount: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  fulfillment_status: "pending" | "processing" | "fulfilled" | "cancelled";
  created_at: string;
}

export async function getOrdersAction(storeId: string): Promise<Order[]> {
  const adminSupabase = await createAdminSupabase();
  const { data, error } = await adminSupabase
    .from("orders")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    // If the table doesn't exist yet, return an empty array gracefully rather than crashing
    if (error.code === "42P01") {
      console.warn("Orders table is missing in Supabase. Returning empty array.");
      return [];
    }
    throw new Error(error.message);
  }

  return (data || []).map((o: any) => ({
    ...o,
    items: Array.isArray(o.items) ? o.items : [],
    total_amount: Number(o.total_amount || 0)
  }));
}

export async function updateOrderStatusAction(
  storeId: string,
  orderId: string,
  paymentStatus: string,
  fulfillmentStatus: string
) {
  const adminSupabase = await createAdminSupabase();
  const { error } = await adminSupabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      fulfillment_status: fulfillmentStatus
    })
    .eq("id", orderId);

  if (error) return { error: error.message };

  revalidatePath(`/${storeId}/orders`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export interface FulfillOrderInput {
  storeId: string;
  orderId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  productName: string;
  profileTier: string;
  durationDays: number;
  inventoryId: string; // The specific inventory shard slot to assign
}

export async function fulfillOrderWithSlotAction(input: FulfillOrderInput) {
  const adminSupabase = await createAdminSupabase();
  const now = new Date();
  const expireDate = new Date(now.getTime() + input.durationDays * 86400000);

  // 1. Fetch the target inventory item to make sure it's valid and unassigned
  const { data: asset, error: assetErr } = await adminSupabase
    .from("inventory")
    .select("*")
    .eq("id", input.inventoryId)
    .single();

  if (assetErr || !asset) {
    return { error: "Target inventory item not found." };
  }

  // 2. Determine Group Name logic (pooling up to 6 members)
  const groupPrefixMatch = `${input.productName} - ${input.profileTier} - ${input.durationDays}Days`;
  const { data: siblingAssets } = await adminSupabase
    .from("inventory")
    .select("group_name")
    .eq("store_id", input.storeId)
    .ilike("group_name", `${groupPrefixMatch}%`);

  const groupCounts: Record<string, number> = {};
  const activeSiblingList = siblingAssets || [];
  activeSiblingList.forEach((item) => {
    if (item.group_name) {
      groupCounts[item.group_name] = (groupCounts[item.group_name] || 0) + 1;
    }
  });

  let assignedGroupName = "";
  let isGroupOwner = false;

  for (const [gName, count] of Object.entries(groupCounts)) {
    if (count < 6) {
      assignedGroupName = gName;
      break;
    }
  }

  if (!assignedGroupName) {
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
    isGroupOwner = true;
  }

  // 3. Update the Inventory Slot in Database
  const { error: updateInvErr } = await adminSupabase
    .from("inventory")
    .update({
      profile_name: input.customerName,
      group_name: assignedGroupName,
      date_buy: now.toISOString(),
      date_expired: expireDate.toISOString()
    })
    .eq("id", input.inventoryId);

  if (updateInvErr) {
    return { error: "Failed to persist slot allocation in database." };
  }

  // 4. Update the Customer profile with the new purchased item if customer_id exists
  if (input.customerId) {
    const { data: customer } = await adminSupabase
      .from("customers")
      .select("purchased_products, total_orders")
      .eq("id", input.customerId)
      .single();

    if (customer) {
      const existingProducts = Array.isArray(customer.purchased_products) ? customer.purchased_products : [];
      // Prevent duplicates in CRM array if already appended
      const alreadyAppended = existingProducts.some((p: any) => p.inventory_id === input.inventoryId);
      
      if (!alreadyAppended) {
        const appendedProducts = [
          ...existingProducts,
          {
            name: input.productName,
            variant: input.profileTier,
            duration_days: input.durationDays,
            bought_date: now.toISOString(),
            expire_date: expireDate.toISOString(),
            group_assigned: assignedGroupName,
            is_owner: isGroupOwner,
            inventory_id: input.inventoryId
          }
        ];

        await adminSupabase
          .from("customers")
          .update({
            purchased_products: appendedProducts,
            total_orders: customer.total_orders + 1
          })
          .eq("id", input.customerId);
      }
    }
  }

  // 5. Update the Order Items JSON and mark fulfillment as completed
  const { data: orderData } = await adminSupabase
    .from("orders")
    .select("items")
    .eq("id", input.orderId)
    .single();

  if (orderData) {
    const items = Array.isArray(orderData.items) ? [...orderData.items] : [];
    const itemToFulfill = items.find((i: any) => i.name === input.productName && i.variant === input.profileTier && !i.inventory_id);
    
    if (itemToFulfill) {
      itemToFulfill.inventory_id = input.inventoryId;
      itemToFulfill.bought_date = now.toISOString();
      itemToFulfill.expire_date = expireDate.toISOString();
    }

    await adminSupabase
      .from("orders")
      .update({
        items,
        fulfillment_status: "fulfilled"
      })
      .eq("id", input.orderId);
  }

  revalidatePath(`/${input.storeId}/orders`);
  revalidatePath(`/${input.storeId}/customers`);
  revalidatePath(`/${input.storeId}/inventory`);
  revalidatePath(`/${input.storeId}/dashboard`);

  return { success: true, allocatedGroupName: assignedGroupName, isOwner: isGroupOwner };
}
