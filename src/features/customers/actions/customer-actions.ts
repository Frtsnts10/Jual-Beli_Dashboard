"use server";

import { adminDb } from "@/lib/firebase/server";
import { revalidatePath } from "next/cache";

export interface PurchasedProduct {
  name: string;
  variant: string;
  duration_days: number;
  bought_date: string;
  expire_date: string;
  date_start?: string;
  device?: string;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string | null;
  phone: string | null;
  purchased_products: PurchasedProduct[];
  total_orders: number;
  created_at: string;
}

export async function getCustomersAction(storeId: string): Promise<Customer[]> {
  const snap = await adminDb.collection("customers")
    .where("store_id", "==", storeId)
    .orderBy("created_at", "desc")
    .get();

  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      purchased_products: Array.isArray(d.purchased_products) ? d.purchased_products : [],
    } as Customer;
  });
}

export async function createCustomerAction(storeId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string) || null;
  const phone = (formData.get("phone") as string) || null;
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
      : new Date(startDateObj.getTime() + duration_days * 86400000);

    purchased_products.push({
      name: product_name,
      variant: product_variant,
      duration_days,
      bought_date: now.toISOString(),
      date_start: startDateObj.toISOString(),
      expire_date: expireDateObj.toISOString(),
    });
  }

  try {
    const docRef = adminDb.collection("customers").doc();
    const data = {
      id: docRef.id,
      store_id: storeId,
      name,
      email,
      phone,
      purchased_products,
      total_orders,
      created_at: new Date().toISOString(),
    };
    await docRef.set(data);

    revalidatePath(`/${storeId}/customers`);
    revalidatePath(`/${storeId}/dashboard`);
    return { data };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateCustomerAction(storeId: string, id: string, data: { first_name: string; last_name: string; email: string | null; phone: string | null }) {
  if (!data.first_name) return { error: "First name required" };

  try {
    const fullName = `${data.first_name} ${data.last_name}`.trim();
    await adminDb.collection("customers").doc(id).update({
      name: fullName,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
    });
    revalidatePath(`/${storeId}/customers`);
    revalidatePath(`/${storeId}/dashboard`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function appendCustomerProductAction(
  storeId: string,
  customerId: string,
  product: { name: string; variant: string; duration_days: number; bought_date?: string; date_start?: string;
  device?: string; expire_date?: string }
) {
  const custDoc = await adminDb.collection("customers").doc(customerId).get();
  if (!custDoc.exists) return { error: "Customer context missing" };

  const customer = custDoc.data()!;
  const existingProducts = Array.isArray(customer.purchased_products) ? customer.purchased_products : [];
  const now = new Date();
  const startDateObj = product.date_start ? new Date(product.date_start) : now;
  const expireDateObj = product.expire_date
    ? new Date(product.expire_date)
    : new Date(startDateObj.getTime() + product.duration_days * 86400000);

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

  await adminDb.collection("customers").doc(customerId).update({
    purchased_products: updatedProducts,
    total_orders: (customer.total_orders || 0) + 1,
  });

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function deleteCustomerAction(storeId: string, id: string) {
  try {
    await adminDb.collection("customers").doc(id).delete();
    revalidatePath(`/${storeId}/customers`);
    revalidatePath(`/${storeId}/dashboard`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function removeCustomerProductAction(storeId: string, customerId: string, productIndex: number) {
  const custDoc = await adminDb.collection("customers").doc(customerId).get();
  if (!custDoc.exists) return { error: "Customer context missing" };

  const customer = custDoc.data()!;
  const products = Array.isArray(customer.purchased_products) ? [...customer.purchased_products] : [];
  if (productIndex < 0 || productIndex >= products.length) return { error: "Invalid product target" };

  const targetItem = products[productIndex];
  products.splice(productIndex, 1);

  if (targetItem?.inventory_id) {
    await adminDb.collection("inventory").doc(targetItem.inventory_id).update({ profile_name: null });
  }

  await adminDb.collection("customers").doc(customerId).update({
    purchased_products: products,
    total_orders: Math.max(0, (customer.total_orders || 0) - 1),
  });

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function extendCustomerProductAction(storeId: string, customerId: string, productIndex: number, addedDays: number) {
  const custDoc = await adminDb.collection("customers").doc(customerId).get();
  if (!custDoc.exists) return { error: "Customer context missing" };

  const customer = custDoc.data()!;
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
    await adminDb.collection("inventory").doc(target.inventory_id).update({ date_expired: nextExp.toISOString() });
  }

  await adminDb.collection("customers").doc(customerId).update({ purchased_products: products });

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/inventory`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export async function banCustomerProductAction(storeId: string, customerId: string, productIndex: number, banReason?: string) {
  const custDoc = await adminDb.collection("customers").doc(customerId).get();
  if (!custDoc.exists) return { error: "Customer context missing" };

  const customer = custDoc.data()!;
  const products = Array.isArray(customer.purchased_products) ? [...customer.purchased_products] : [];
  if (productIndex < 0 || productIndex >= products.length) return { error: "Invalid product target" };

  products[productIndex].status = "banned";
  (products[productIndex] as any).banned_reason = banReason || "Violation of workspace integrity parameters";

  await adminDb.collection("customers").doc(customerId).update({ purchased_products: products });

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}

export interface AllocationOrderInput {
  storeId: string;
  customerId: string;
  customerName: string;
  productName: string;
  profileTier: string;
  durationDays: number;
}

export async function createAndAllocateCustomerOrderAction(input: AllocationOrderInput) {
  const now = new Date();
  const expireDate = new Date(now.getTime() + input.durationDays * 86400000);

  // 1. AUTO-PICKER: Find any unassigned inventory asset
  const assetsSnap = await adminDb.collection("inventory")
    .where("store_id", "==", input.storeId)
    .where("profile_tier", "==", input.profileTier)
    .get();

  // Filter for matching product name (case-insensitive) and unassigned
  const available = assetsSnap.docs
    .map(d => ({ id: d.id, ...d.data() } as any))
    .filter((a: any) => a.name?.toLowerCase() === input.productName.toLowerCase() && !a.profile_name);

  if (available.length === 0) {
    return { error: `Zero unassigned inventory items available for '${input.productName} (${input.profileTier})'. Please restock.` };
  }

  const selectedAsset = available[0];

  // 2. Group Logic
  const groupPrefixMatch = `${input.productName} - ${input.profileTier} - ${input.durationDays}Days`;
  const siblingSnap = await adminDb.collection("inventory")
    .where("store_id", "==", input.storeId)
    .get();

  const groupCounts: Record<string, number> = {};
  siblingSnap.docs.forEach(doc => {
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
    Object.keys(groupCounts).forEach(gName => {
      const match = gName.match(/\(Group #(\d+)\)/);
      if (match?.[1]) {
        const idx = parseInt(match[1], 10);
        if (idx > maxIdx) maxIdx = idx;
      }
    });
    assignedGroupName = `${groupPrefixMatch} (Group #${maxIdx + 1})`;
    isGroupOwner = true;
  }

  // 3. Update Inventory Slot
  await adminDb.collection("inventory").doc(selectedAsset.id).update({
    profile_name: input.customerName,
    group_name: assignedGroupName,
    date_buy: now.toISOString(),
    date_expired: expireDate.toISOString(),
  });

  // 4. Update Customer
  const custDoc = await adminDb.collection("customers").doc(input.customerId).get();
  if (custDoc.exists) {
    const customer = custDoc.data()!;
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
        is_owner: isGroupOwner,
        inventory_id: selectedAsset.id,
      },
    ];

    await adminDb.collection("customers").doc(input.customerId).update({
      purchased_products: appendedProducts,
      total_orders: (customer.total_orders || 0) + 1,
    });
  }

  revalidatePath(`/${input.storeId}/customers`);
  revalidatePath(`/${input.storeId}/inventory`);
  return { success: true, allocatedGroupName: assignedGroupName, isOwner: isGroupOwner };
}

export async function importCustomersCsvAction(storeId: string, rows: any[]) {
  const batch = adminDb.batch();
  const inserts = rows.map(row => {
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
      const expireObj = new Date(bought_date.getTime() + duration_days * 86400000);

      purchased_products.push({
        name: row.product_name,
        variant: row.product_variant || "1user",
        duration_days,
        bought_date: bought_date.toISOString(),
        date_start: bought_date.toISOString(),
        expire_date: expireObj.toISOString(),
      });
    }

    const docRef = adminDb.collection("customers").doc();
    const data = {
      id: docRef.id,
      store_id: storeId,
      name,
      email,
      phone,
      purchased_products,
      total_orders,
      created_at: new Date().toISOString(),
    };
    batch.set(docRef, data);
    return data;
  });

  if (inserts.length === 0) return { error: "No valid rows found to import" };

  try {
    await batch.commit();
    revalidatePath(`/${storeId}/customers`);
    revalidatePath(`/${storeId}/dashboard`);
    return { success: true, count: inserts.length };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function importComplexExcelDataAction(storeId: string, rows: any[]) {
  // Declare all collections upfront
  const customersMap = new Map<string, any>();
  const inventoryMap = new Map<string, { ref: any; data: any }>();
  const ordersToCreate: any[] = [];

  rows.forEach(row => {
    const phone = row.phone || row.customer_email || "UnknownPhone";
    if (!customersMap.has(phone)) {
      customersMap.set(phone, {
        id: adminDb.collection("customers").doc().id,
        phone: row.phone || null,
        name: row.customer_name || "Unnamed Customer",
        email: row.customer_email || null,
        purchased_products: [],
        total_orders: 0
      });
    }

    const customer = customersMap.get(phone);
    const boughtDate = new Date(row.bought_date || new Date().toISOString());
    const expireObj = new Date(boughtDate.getTime() + ((row.duration_days || 30) * 86400000));
    const groupName = `${row.product_name} Master Account Pool — ${row.vault_email || "Unknown"}`;

    // Dedup key: same vault email + password + profile name = same physical slot
    const dedupKey = [
      (row.vault_email || "").toLowerCase().trim(),
      (row.vault_password || "").trim(),
      (row.profile_name || "").toLowerCase().trim(),
      (row.product_name || "").toLowerCase().trim(),
    ].join("||");

    // Capacity based on tier
    const tierStr = (row.product_variant || "1user").toLowerCase();
    let capacity = 1;
    if (tierStr === "2user" || tierStr === "2u") capacity = 2;
    else if (tierStr === "3user" || tierStr === "3u") capacity = 3;

    let invRef: any;
    if (inventoryMap.has(dedupKey)) {
      const existing = inventoryMap.get(dedupKey)!;
      existing.data.stock = Math.max(0, existing.data.stock - 1);
      invRef = existing.ref;
    } else {
      const invDocRef = adminDb.collection("inventory").doc();
      const invData = {
        id: invDocRef.id,
        store_id: storeId,
        name: row.product_name,
        profile_tier: row.product_variant || "1user",
        profile_name: row.profile_name || null,
        email: row.vault_email || null,
        password: row.vault_password || null,
        pin: row.profile_pin || null,
        base_price: 0,
        selling_price: 0,
        price: 0,
        stock: capacity - 1,
        capacity,
        date_buy: boughtDate.toISOString(),
        date_expired: expireObj.toISOString(),
        category: row.product_name || null,
        group_name: groupName,
        created_at: new Date().toISOString(),
      };
      inventoryMap.set(dedupKey, { ref: invDocRef, data: invData });
      invRef = invDocRef;
    }

    customer.purchased_products.push({
      name: row.product_name,
      variant: row.product_variant || "1user",
      duration_days: row.duration_days || 30,
      bought_date: boughtDate.toISOString(),
      date_start: boughtDate.toISOString(),
      expire_date: expireObj.toISOString(),
      group_assigned: groupName,
      inventory_id: invRef.id,
      is_owner: false,
    });
    customer.total_orders += 1;

    // Create a fulfilled order record (shows in Orders Queue)
    const orderId = `ORD-${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const orderRef = adminDb.collection("orders").doc(orderId);
    ordersToCreate.push({
      ref: orderRef,
      data: {
        id: orderRef.id,
        store_id: storeId,
        customer_id: customer.id,
        customer_name: row.phone || row.customer_email || "Unnamed Customer",
        customer_email: row.customer_email || "",
        items: [{
          name: row.product_name,
          variant: row.product_variant || "1user",
          duration_days: row.duration_days || 30,
          price: 0,
          bought_date: boughtDate.toISOString(),
          expire_date: expireObj.toISOString(),
          inventory_id: invRef.id,
        }],
        total_amount: 0,
        payment_status: "paid",
        fulfillment_status: "fulfilled",
        created_at: boughtDate.toISOString(),
      }
    });
  });

  const inventoryToCreate = Array.from(inventoryMap.values());

  if (rows.length === 0) return { error: "No valid rows found to import" };

  try {
    const batches: Promise<any>[] = [];
    let currentBatch = adminDb.batch();
    let opCount = 0;

    const commitCurrentBatch = () => {
      batches.push(currentBatch.commit());
      currentBatch = adminDb.batch();
      opCount = 0;
    };

    inventoryToCreate.forEach(inv => {
      currentBatch.set(inv.ref, inv.data);
      opCount++;
      if (opCount >= 450) commitCurrentBatch();
    });

    customersMap.forEach(customer => {
      const docRef = adminDb.collection("customers").doc(customer.id);
      currentBatch.set(docRef, {
        ...customer,
        store_id: storeId,
        created_at: new Date().toISOString()
      });
      opCount++;
      if (opCount >= 450) commitCurrentBatch();
    });

    ordersToCreate.forEach(order => {
      currentBatch.set(order.ref, order.data);
      opCount++;
      if (opCount >= 450) commitCurrentBatch();
    });

    if (opCount > 0) batches.push(currentBatch.commit());
    await Promise.all(batches);

    revalidatePath(`/${storeId}/customers`);
    revalidatePath(`/${storeId}/inventory`);
    revalidatePath(`/${storeId}/orders`);
    revalidatePath(`/${storeId}/dashboard`);
    return { success: true, count: rows.length };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function updateCustomerProductDeviceAction(storeId: string, customerId: string, productIndex: number, device: string) {
  const custDoc = await adminDb.collection("customers").doc(customerId).get();
  if (!custDoc.exists) return { error: "Customer context missing" };

  const customer = custDoc.data()!;
  const products = Array.isArray(customer.purchased_products) ? [...customer.purchased_products] : [];
  if (productIndex < 0 || productIndex >= products.length) return { error: "Invalid product target" };

  products[productIndex].device = device;

  await adminDb.collection("customers").doc(customerId).update({ purchased_products: products });

  revalidatePath(`/${storeId}/customers`);
  revalidatePath(`/${storeId}/dashboard`);
  return { success: true };
}
