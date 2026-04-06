filepath = r'd:\Projects\EMS\Files\Adarsh Final 28-3\Frontend\app\globals.css'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# Remove stray literal backslashes from tailwind syntax
text = text.replace(r'\]', ']')
text = text.replace(r'\[', '[')
text = text.replace(r'\(', '(')
text = text.replace(r'\)', ')')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
