import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/app/(dashboard)/[storeId]/profile/page.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# 1. Import SubscriptionDetailsPanel
if "SubscriptionDetailsPanel" not in content:
    content = content.replace('import { MfaEnrollment } from "@/features/auth/components/mfa-enrollment";',
                              'import { MfaEnrollment } from "@/features/auth/components/mfa-enrollment";\nimport { SubscriptionDetailsPanel } from "@/features/subscription/components/subscription-details-panel";')

# 2. Add it before EditProfileForm or AppearanceSettingsPanel
# Let's add it in the right column above AppearanceSettingsPanel
if "<SubscriptionDetailsPanel" not in content:
    panel_code = """          <SubscriptionDetailsPanel 
            isPremium={profile.is_premium || false}
            tier={profile.subscription_tier}
            planName={profile.subscription_plan_name}
            activeUntil={profile.subscription_active_until}
          />
"""
    content = content.replace('<AppearanceSettingsPanel />', panel_code + '          <AppearanceSettingsPanel />')

with open(filepath, 'w') as f:
    f.write(content)

print("profile page patched")
