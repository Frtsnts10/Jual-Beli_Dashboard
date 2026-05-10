-- ==========================================
-- SHOP DASHBOARD FINAL SCHEMA
-- ==========================================

-- 1. Reset
DROP TABLE IF EXISTS "subscriptions";
DROP TABLE IF EXISTS "inventory";
DROP TABLE IF EXISTS "profiles";

-- 2. Profiles (Shops)
CREATE TABLE "profiles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "shop_name" TEXT NOT NULL,
    "whatsapp_number" TEXT,
    "currency" TEXT DEFAULT 'IDR',
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- 3. Inventory (Stock)
CREATE TABLE "inventory" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" UUID REFERENCES "profiles"("id") ON DELETE CASCADE,
    "app_name" TEXT NOT NULL,
    "profile_name" TEXT,
    "login_email" TEXT NOT NULL,
    "login_password" TEXT NOT NULL,
    "capital_cost" NUMERIC DEFAULT 0,
    "status" TEXT DEFAULT 'Tersedia',
    "restock_date" DATE,
    "supplier_billing_date" DATE,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- 4. Subscriptions (Customers)
CREATE TABLE "subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" UUID REFERENCES "profiles"("id") ON DELETE CASCADE,
    "inventory_id" UUID REFERENCES "inventory"("id") ON DELETE SET NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "whatsapp_number" TEXT NOT NULL,
    "subscription_plan" TEXT,
    "selling_price" NUMERIC DEFAULT 0,
    "start_date" DATE DEFAULT CURRENT_DATE,
    "duration" INTEGER,
    "expiry_date" DATE,
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- 5. Security (Disable RLS for easy management)
ALTER TABLE "profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;
