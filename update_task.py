import re

filepath = "/Users/filbert/.gemini/antigravity-ide/brain/1f09fda7-094a-4739-8209-990e81e1f974/task.md"

with open(filepath, 'r') as f:
    content = f.read()

content = content.replace("- `[/]` 1. Fix the English dictionary bug", "- `[x]` 1. Fix the English dictionary bug")
content = content.replace("- `[ ]` 2. Add language preference", "- `[/]` 2. Add language preference")

with open(filepath, 'w') as f:
    f.write(content)
