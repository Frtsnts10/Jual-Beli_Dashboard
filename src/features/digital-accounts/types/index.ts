export interface DigitalAccount {
  id: string;
  store_id: string;
  provider: string; // e.g., "Netflix", "Spotify", "Canva"
  email: string;
  password: string; // Master password
  account_type: "1U" | "2U" | "4U" | string; // e.g., 2 Screens
  total_profiles: number;
  profiles: string[]; // Array of profile names, e.g., ["upin", "ipin"]
  status: "ACTIVE" | "FULL" | "SUSPENDED" | "EXPIRED";
  created_at: string;
  updated_at: string;
}

export interface DigitalCustomer {
  id: string;
  store_id: string;
  phone_number: string;
  name?: string;
  total_orders: number;
  created_at: string;
}

export interface DigitalSubscription {
  id: string;
  store_id: string;
  customer_id: string; // Ref to DigitalCustomer
  account_id: string; // Ref to DigitalAccount
  profile_assigned: string; // e.g., "upin"
  duration_months: number;
  order_date: string; // ISO date string
  expiry_date: string; // ISO date string
  device_used: string; // e.g., "laptop lenovo"
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  created_at: string;
  updated_at: string;
}
