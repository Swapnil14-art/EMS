import os

directories = ['app', 'components', 'lib']

replacements = [
    ('text-[rgb(var(--text-[rgb(var(--color-primary))]))]', 'text-[rgb(var(--text-primary))]'),
    ('text-[rgb(var(--text-[rgb(var(--color-secondary))]))]', 'text-[rgb(var(--text-secondary))]')
]

processed_files = 0
changed_files = 0

for d in directories:
    for root, dirs, files in os.walk(d):
        for name in files:
            if not name.endswith(('.tsx', '.ts')):
                continue
                
            filepath = os.path.join(root, name)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            for old, new in replacements:
                content = content.replace(old, new)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                changed_files += 1
            processed_files += 1

print(f"Fixed nested {changed_files} files using raw string replace.")
