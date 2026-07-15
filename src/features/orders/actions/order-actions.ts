"use server";

import { adminDb, verifyStoreAccess } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export interface OrderItem {
  name: string;
  variant: string;
  duration_days: number;
  price?: number;
  bought_date?: string;
  expire_date?: string;
  inventory_id?: string;
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
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) throw new Error("Unauthorized access to store");

  try {
    const snap = await adminDb.collection("orders")
      .where("store_id", "==", storeId)
      .get();

    const orders = snap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        items: Array.isArray(d.items) ? d.items : [],
        total_amount: Number(d.total_amount || 0),
      } as Order;
    });
    
    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err: any) {
    console.warn("Orders collection may not exist yet:", err.message);
    return [];
  }
}

export async function updateOrderStatusAction(
  storeId: string,
  orderId: string,
  paymentStatus: string,
  fulfillmentStatus: string
) {
  const isAuthorized = await verifyStoreAccess(storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  try {
    await adminDb.collection("orders").doc(orderId).update({
      payment_status: paymentStatus,
      fulfillment_status: fulfillmentStatus,
    });
    revalidatePath(`/${storeId}/orders`);
    revalidatePath(`/${storeId}/dashboard`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
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
  inventoryId: string;
}

export async function fulfillOrderWithSlotAction(input: FulfillOrderInput) {
  const isAuthorized = await verifyStoreAccess(input.storeId);
  if (!isAuthorized) return { error: "Unauthorized access to store" };

  const now = new Date();
  const expireDate = new Date(now.getTime() + input.durationDays * 86400000);

  // 1. Fetch the target inventory item
  const assetDoc = await adminDb.collection("inventory").doc(input.inventoryId).get();
  if (!assetDoc.exists) {
    return { error: "Target inventory item not found." };
  }

  // 2. Determine Group Name logic
  const groupPrefixMatch = `${input.productName} - ${input.profileTier} - ${input.durationDays}Days`;
  const siblingSnap = await adminDb.collection("inventory")
    .where("store_id", "==", input.storeId)
    .get();

  const groupCounts: Record<string, number> = {};
  siblingSnap.docs.forEach((doc) => {
    const gn = doc.data().group_name;
    if (gn && (gn as string).startsWith(groupPrefixMatch)) {
      groupCounts[gn] = (groupCounts[gn] || 0) + 1;
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

  // 3. Update the Inventory Slot
  await adminDb.collection("inventory").doc(input.inventoryId).update({
    profile_name: input.customerName,
    group_name: assignedGroupName,
    date_buy: now.toISOString(),
    date_expired: expireDate.toISOString(),
  });

  // 4. Update the Customer profile
  if (input.customerId) {
    const custDoc = await adminDb.collection("customers").doc(input.customerId).get();
    if (custDoc.exists) {
      const customer = custDoc.data()!;
      const existingProducts = Array.isArray(customer.purchased_products) ? customer.purchased_products : [];
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
            inventory_id: input.inventoryId,
          },
        ];
        await adminDb.collection("customers").doc(input.customerId).update({
          purchased_products: appendedProducts,
          total_orders: (customer.total_orders || 0) + 1,
        });
      }
    }
  }

  // 5. Update the Order
  const orderDoc = await adminDb.collection("orders").doc(input.orderId).get();
  if (orderDoc.exists) {
    const orderData = orderDoc.data()!;
    const items = Array.isArray(orderData.items) ? [...orderData.items] : [];
    const itemToFulfill = items.find((i: any) => i.name === input.productName && i.variant === input.profileTier && !i.inventory_id);

    if (itemToFulfill) {
      itemToFulfill.inventory_id = input.inventoryId;
      itemToFulfill.bought_date = now.toISOString();
      itemToFulfill.expire_date = expireDate.toISOString();
    }

    await adminDb.collection("orders").doc(input.orderId).update({
      items,
      fulfillment_status: "fulfilled",
    });
  }

  revalidatePath(`/${input.storeId}/orders`);
  revalidatePath(`/${input.storeId}/customers`);
  revalidatePath(`/${input.storeId}/inventory`);
  revalidatePath(`/${input.storeId}/dashboard`);

  return { success: true, allocatedGroupName: assignedGroupName, isOwner: isGroupOwner };
}
