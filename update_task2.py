import re

filepath = "/Users/filbert/.gemini/antigravity-ide/brain/1f09fda7-094a-4739-8209-990e81e1f974/task.md"

with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("- `[/]` 2. Add language preference", "- `[x]` 2. Add language preference")
content = content.replace("- `[ ]` 3. Apply the language preference", "- `[x]` 3. Apply the language preference")
content = content.replace("- `[ ]` 4. Update checkout", "- `[/]` 4. Update checkout")

with open(filepath, 'w') as f:
    f.write(content)
