# Shop Dashboard — Admin Panel

Dashboard manajemen toko digital premium yang dibangun dengan Next.js 14, Supabase, dan HeroUI. Dirancang untuk efisiensi tinggi dalam mengelola stok akun digital (Netflix, Spotify, dll) dan pelanggan.

## ✨ Fitur Utama

- **Multi-Shop Management**: Kelola beberapa jenis toko dalam satu dashboard admin. Pindah antar toko secara instan.
- **Financial Tracking**: Pantau Pemasukan (Revenue), Modal (Cost), dan Keuntungan Bersih (Profit) secara real-time.
- **Onboarding Experience**: Panduan pengaturan awal untuk toko baru.
- **Inventory Management**: Kelola stok akun dengan detail login, modal, dan status ketersediaan.
- **Customer CRM**: Database pelanggan dengan pelacakan paket langganan dan tanggal kedaluwarsa otomatis.
- **Import/Export Excel**: Fitur impor stok masal dan ekspor data untuk laporan.
- **Premium UI/UX**: Desain Glassmorphism yang modern, responsif, dan mendukung Dark Mode.
- **Localization**: Mendukung mata uang global (IDR, USD, EUR, dll) dan format tanggal Indonesia.

## 🚀 Teknologi

- **Frontend**: Next.js (App Router), TypeScript, TailwindCSS
- **UI Components**: HeroUI (NextUI), Lucide React, Sonner
- **Database**: Supabase (PostgreSQL) + Real-time Subscriptions
- **Excel Logic**: SheetJS (XLSX)
- **State Management**: React Context API

## 🛠️ Persiapan Database

Silakan jalankan SQL berikut di Supabase SQL Editor untuk menyiapkan skema tabel yang dibutuhkan:

```sql
-- 1. Tabel Profiles (Shops)
CREATE TABLE "profiles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "shop_name" TEXT NOT NULL,
    "whatsapp_number" TEXT,
    "currency" TEXT DEFAULT 'IDR',
    "created_at" TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Inventory
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

-- 3. Tabel Subscriptions (Pelanggan)
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
```

## 📦 Instalasi

1. Clone repositori
2. `npm install`
3. Siapkan file `.env.local` dengan kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```
4. `npm run dev`

---
*Dibuat dengan ❤️ oleh Antigravity.*
