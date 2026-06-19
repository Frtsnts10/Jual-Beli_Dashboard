import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/features/dashboard/components/dashboard-nav.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# Remove the zoom-in animation
content = content.replace("animate-in zoom-in-95 duration-150", "")

with open(filepath, 'w') as f:
    f.write(content)

print("dashboard-nav patched")
