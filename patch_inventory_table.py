import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/features/inventory/components/inventory-table.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# Replace Table Headers
content = content.replace(">Product Asset</th>", ">Aset Produk</th>")
content = content.replace(">Profile Designation</th>", ">Profil</th>")
content = content.replace(">Delivery Credentials</th>", ">Kredensial</th>")
content = content.replace(">Pricing Matrix</th>", ">Harga</th>")
content = content.replace(">Lifecycle Target</th>", ">Masa Aktif</th>")
content = content.replace(">Controls</th>", ">Aksi</th>")

# Replace "Buy: " and "Exp: "
content = content.replace(">Buy: {", ">Beli: {")
content = content.replace(">Exp: {", ">Exp: {") # 'Exp' is actually fine in Indonesian, or we could change to 'Kedaluwarsa:' but let's just use 'Exp:' or 'Batas:'

with open(filepath, 'w') as f:
    f.write(content)

print("inventory-table patched")
