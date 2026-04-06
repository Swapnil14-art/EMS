import os
import re

directories = ['app', 'components', 'lib']

replacements = [
    (r'(?<!-)from-brand-[0-9]+', 'from-primary'),
    (r'(?<!-)to-brand-[0-9]+', 'to-primary/80'),
    (r'border-t-brand-[0-9]+', 'border-t-primary'),
    
    # Specific hardcoded ones encountered
    (r'bg-blue-100\b', 'bg-primary/10'),
    (r'bg-blue-200\b', 'bg-primary/20'),
    (r'bg-blue-300\b', 'bg-primary/30'),
    (r'text-blue-100\b', 'text-primary/10'),
    (r'text-blue-200\b', 'text-primary/20'),
    (r'text-blue-[5-9]00\b', 'text-primary'),
    
    (r'bg-purple-100\b', 'bg-secondary/10'),
    (r'bg-purple-50\b', 'bg-surface'),
    (r'text-purple-[5-9]00\b', 'text-secondary'),
]

for d in directories:
    for root, dirs, files in os.walk(d):
        for name in files:
            if not name.endswith(('.tsx', '.ts')):
                continue
                
            filepath = os.path.join(root, name)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            for pattern, replace in replacements:
                content = re.sub(pattern, replace, content)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
