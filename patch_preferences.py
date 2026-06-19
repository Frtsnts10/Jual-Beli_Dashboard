import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/features/settings/components/store-preferences-form.tsx"

with open(filepath, 'r') as f:
    content = f.read()

# Import the new action
if "updateUserLanguageAction" not in content:
    content = content.replace('import { updateStoreSettingsAction } from "../actions/settings-actions";',
                              'import { updateStoreSettingsAction } from "../actions/settings-actions";\nimport { updateUserLanguageAction } from "@/features/auth/actions/update-language-action";')

# Call the action in handleSubmit
if "await updateUserLanguageAction(" not in content:
    # Find changeLanguage(selectedLang as Language);
    # Replace it with await updateUserLanguageAction(selectedLang as Language); changeLanguage(selectedLang as Language);
    content = content.replace('changeLanguage(selectedLang as Language);',
                              'await updateUserLanguageAction(selectedLang as Language);\n        changeLanguage(selectedLang as Language);')

with open(filepath, 'w') as f:
    f.write(content)

print("store-preferences-form.tsx patched")
