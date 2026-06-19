import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/locales/dictionary.ts"

with open(filepath, 'r') as f:
    content = f.read()

en_settings = """    settings: {
      labelStoreBio: "Store Bio / Short Description",
      pageTitle: "Store Settings",
      pageSubtitle: "Manage your workspace identity, preferences, and integrations.",
      credentialsTitle: "Store Developer Credentials",
      credentialsSubtitle: "Use these parameters to interface your headless storefronts, mobile apps, or backend webhooks directly with this instance.",
      labelWorkspaceId: "Workspace ID (Store ID)",
      labelPublicKey: "Public API Key (Client)",
      comingSoon: "Coming soon...",
      integrationsTitle: "API Integrations & Keys",
      integrationsSubtitle: "Configure your payment gateways. These keys are used on your storefront to process customer transactions directly into your merchant account.",
      labelServerKey: "Server Key",
      labelClientKey: "Client Key",
      btnSaveApiKeys: "Save API Configuration",
      btnSavingApiKeys: "Saving Keys...",
      successApiKeys: "API Keys updated successfully!",
      preferencesTitle: "Global Preferences Matrix",
      preferencesSubtitle: "Configure global preferences such as language and base currency.",
      btnSavePreferences: "Save Preferences",
      btnSavingPreferences: "Saving...",
      successPreferences: "Preferences saved successfully.",
      tenantTitle: "Tenant Properties Matrix",
      tenantSubtitle: "Modify public alias signatures, high-fidelity auto-compressed logos, and base currency descriptors.",
      tenantSuccess: "Workspace configuration matrix synchronised to persistent Firebase memory successfully.",
      labelWorkspaceName: "Workspace Designation",
      labelGlobalCurrency: "Global Preferences Currency",
      labelLanguage: "Language Preferences (Language)",
      labelStoreEmail: "Store Email Address",
      labelWhatsapp: "WhatsApp Support Number (e.g. 6281...)",
      labelInstagram: "Instagram Profile Handle",
      labelLogoTitle: "Brand Logo Matrix (Auto-Resized Client Container)",
      labelLogoDesc: "Uploaded images compress dynamically via local canvas buffers to optimal lightweight WEBP payloads.",
      btnChooseGraphic: "Choose Graphic",
      btnSaveSettings: "Save Properties Matrix",
      btnSavingSettings: "Applying Toko Mutations...",
      appearanceTitle: "Interface Appearance Preferences",
      appearanceSubtitle: "Configure system color mapping parameters instantly. Selections trigger real-time persistent local storage syncing.",
      themeSystem: "System",
      themeLight: "Light",
      themeDark: "Dark",
      dangerTitle: "Danger Deletion Area",
      dangerDesc: "Instantly drops the active toko pointer and deletes memory footprints irrevocably. Data exports must be captured prior to triggering execution.",
      btnPurge: "Purge Workspace Instance",
      btnPurging: "Dropping Toko..."
    },"""

# We need to replace the `settings` block inside the `en: {` block
# A safer way to replace exactly what we want is to find "en: {" and then replace its "settings: {" to "},"
# But using a targeted re.sub might be easier. Let's do it using index.

en_index = content.find("en: {")
if en_index != -1:
    settings_start = content.find("settings: {", en_index)
    if settings_start != -1:
        settings_end = content.find("subscription: {", settings_start)
        if settings_end != -1:
            # We want to replace from settings_start up to settings_end
            new_content = content[:settings_start] + en_settings + "\n" + content[settings_end:]
            with open(filepath, 'w') as f:
                f.write(new_content)
            print("en.settings patched successfully.")
        else:
            print("subscription: { not found")
    else:
        print("settings: { not found")
else:
    print("en: { not found")
