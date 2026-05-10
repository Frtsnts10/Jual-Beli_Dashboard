CREATE TABLE IF NOT EXISTS "profiles" (
    "id" TEXT PRIMARY KEY,
    "shop_name" TEXT,
    "whatsapp_number" TEXT,
    "currency" TEXT DEFAULT 'IDR'
);

INSERT INTO "profiles" (id, shop_name, whatsapp_number, currency)
VALUES ('settings', 'Shop Admin', '', 'IDR')
ON CONFLICT (id) DO NOTHING;
