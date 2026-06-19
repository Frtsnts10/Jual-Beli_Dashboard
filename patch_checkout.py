import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/app/checkout/[storeId]/page.tsx"

with open(filepath, 'r') as f:
    content = f.read()

replacement = """    // 2. Set is_premium in user profile
    if (store?.owner_id) {
      await adminDb.collection("profiles").doc(store.owner_id).update({ 
        is_premium: true,
        subscription_tier: interval,
        subscription_plan_name: billingInfo.planName,
        subscription_active_until: expiryDate
      });
    }"""

content = re.sub(r'// 2\. Set is_premium in user profile\s+if \(store\?\.owner_id\) \{\s+await adminDb\.collection\("profiles"\)\.doc\(store\.owner_id\)\.update\(\{ is_premium: true \}\);\s+\}', replacement, content)

with open(filepath, 'w') as f:
    f.write(content)

print("checkout patched")
