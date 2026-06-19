import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/features/orders/components/orders-table.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# Replace pill span classes to ensure perfect alignment
content = content.replace("px-2 py-0.5 font-bold text-[9px]", "inline-flex items-center justify-center px-2 h-[22px] font-bold text-[9px] leading-none")

with open(filepath, 'w') as f:
    f.write(content)

print("orders-table patched")
