import re

filepath = "/Users/filbert/Documents/01 Projects/GitHub/Shop-Dashboard/src/app/(dashboard)/layout.tsx"

with open(filepath, 'r') as f:
    content = f.read()

if "import { LanguageInitializer }" not in content:
    content = content.replace('import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";',
                              'import { getAuthenticatedUser, adminDb } from "@/lib/firebase/server";\nimport { LanguageInitializer } from "@/components/language-initializer";')

# Inject <LanguageInitializer preferredLanguage={...} /> into the return statement
if "let prefLang;" not in content:
    # First, extract preferredLanguage from profileDoc
    content = content.replace('if (!profileDoc.exists) {',
                              'let prefLang;\n      if (profileDoc.exists) {\n        prefLang = profileDoc.data()?.preferred_language;\n      }\n      if (!profileDoc.exists) {')

    # Add <LanguageInitializer /> inside the return statement
    # The return statement is: return <>{children}</>;
    content = content.replace('return <>{children}</>;',
                              'return <>\n      {prefLang && <LanguageInitializer preferredLanguage={prefLang} />}\n      {children}\n    </>;')

with open(filepath, 'w') as f:
    f.write(content)

print("layout patched")
