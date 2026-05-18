# 🔮 Obsidian Shard Dashboard

A premium, high-fidelity **Multi-Tenant Software-as-a-Service (SaaS)** administration suite designed to orchestrate independent digital commerce storefronts, customer lists, order queues, and SLA breakdowns. Powered by Next.js, Tailwind CSS, and Supabase.

---

## 🌌 High-Fidelity Architecture

The platform operates on a single-database, strictly isolated **Multi-Tenant Sharding Architecture**:

```
                       🔑 Logged-in User (Supabase Auth UID)
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
                 🏬 Store Shard A              🏬 Store Shard B
             (owner_id = user.id)           (owner_id = user.id)
                         │                             │
        ┌────────────────┼────────────────┐            ▼
        ▼                ▼                ▼     [Separate Tenant Assets]
   📦 Inventory     👥 Customers     💬 Complaints
  (store_id = A)   (store_id = A)   (store_id = A)
```

1. **Strict Store Separation:** Stores are owned by specific merchant accounts (`owner_id`). When a merchant logs in, they only retrieve their designated store entities.
2. **Sub-Asset Isolation:** Products, customer databases, orders, and complaints are mapped to individual stores via `store_id` UUID columns. Data can never bleed between different stores.
3. **Database RLS Firewalls:** Enforced at the core engine layer using custom Supabase Row Level Security (RLS) policies.

---

## 🔒 Premium SaaS Feature Gating

The dashboard features built-in product plan tiers, dynamically driven by the database:

### 🆓 Standard Core ($0/mo)
*   **Active Store Limits:** Up to 3 active stores.
*   **SKU Inventory Quota:** Capped at **3 active products**. Exceeding the quota displays a gradient warning banner and blocks new product ingestion.
*   **Bulk CSV Uploads:** Locked. Trying to import bulk CSV rows triggers a modal block.
*   **Incident Desk:** Locked behind a glassmorphic **Premium Lock Overlay**.

### 👑 Pro Matrix Tiers (Monthly, Yearly & Lifetime)
*   **Shop Dashboard Pro (Monthly):** Billed at `$49/mo` per workspace.
*   **Shop Dashboard Pro (Yearly):** Billed at `$399/yr` (**Saves 30%**).
*   **Shop Dashboard Pro (Lifetime):** Billed at `$999` one-time (**Infinite Access** with gold badges).
*   **Unlocks:** Unlimited products, bulk CSV parsing, full SLA complaint desk, and webhook arrays.

---

## 🛠️ Database Schema Blueprint

Execute the following migrations inside your **Supabase SQL Editor** to establish the database dependencies:

```sql
-- 1. Profiles Table (User details & plan toggles)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Stores Table (Independent merchant storefronts)
CREATE TABLE public.stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  currency TEXT DEFAULT 'IDR' NOT NULL,
  email TEXT DEFAULT 'support@yourdomain.com' NOT NULL,
  instagram TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Inventory Table (Digital assets catalogue)
CREATE TABLE public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  price NUMERIC NOT NULL,
  selling_price NUMERIC NOT NULL,
  stock INT DEFAULT 0 NOT NULL,
  date_expired TIMESTAMP WITH TIME ZONE,
  profile_tier TEXT DEFAULT 'Standard',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Customers Table (Buyer telemetry records)
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  total_orders INT DEFAULT 0 NOT NULL,
  purchased_products JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Subscriptions Table (Stripe plan bindings)
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 🔐 Database Security: Row Level Security (RLS)

To secure the database, enable RLS and execute these access policies:

```sql
-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- STORES POLICY: Users can only see and manage stores they own
CREATE POLICY "Users can manage their own stores" 
ON public.stores FOR ALL TO authenticated 
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- INVENTORY POLICY: Users can only see products of stores they own
CREATE POLICY "Users can manage products of owned stores" 
ON public.inventory FOR ALL TO authenticated 
USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- CUSTOMERS POLICY: Users can only see customers of stores they own
CREATE POLICY "Users can manage customers of owned stores" 
ON public.customers FOR ALL TO authenticated 
USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
```

---

## 🚀 Local Development Setup

### 1. Environment Variable Bindings (`.env.local`)
Create a `.env.local` file at the root:

```env
# Supabase Secure Shard Credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_private_service_role_key

# Stripe Mock Gateway Webhooks
STRIPE_PREMIUM_PLAN_PRICE_ID=price_mock_id
STRIPE_SECRET_KEY=sk_test_mock_secret
```

### 2. Start the Dev Server
```bash
# Install package dependencies
npm install

# Run hot-reloading dashboard server
npm run dev
```

The portal compiles locally at [http://localhost:3000](http://localhost:3000).
