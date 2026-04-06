import re

filepath = r'd:\Projects\EMS\Files\Adarsh Final 28-3\Frontend\app\globals.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix rgba(var(--color-primary), 0.9) to rgb(var(--color-primary) / 0.9)
content = re.sub(r'rgba\(var\(--color-([a-z]+)\),\s*([0-9.]+)\)', r'rgb(var(--color-\1) / \2)', content)

# Look for bare var(--color-something) that is NOT preceded by rgb( or rgba(
# or rgb(var(...) / ...)
content = re.sub(r'(?<!rgb\()(?<!rgba\()var\(--color-([a-z]+)\)', r'rgb(var(--color-\1))', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
