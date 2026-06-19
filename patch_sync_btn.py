import os

files = [
    "src/features/orders/components/orders-table.tsx",
    "src/features/inventory/components/inventory-table.tsx",
    "src/features/customers/components/customer-table.tsx"
]

for filepath in files:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Replace the class
        content = content.replace("bg-[#242b4d] hover:bg-[#2c345d] text-[#7daaf2]", "bg-[#e2e2f6] hover:bg-[#d0d0ed] text-[#065bce]")
        
        # Replace the text
        content = content.replace("SINKRONISASI DATA LANGSUNG", "SYNC")
        
        with open(filepath, 'w') as f:
            f.write(content)
            
print("Sync buttons patched.")
