import os
import re

directories = ['app', 'components', 'lib']

# Strict replacements based on rules
# We format as (regex_pattern, replacement_string)
# Using \b to ensure whole word match where appropriate
replacements = [
    # Backgrounds & Utilities
    (r'bg-brand-50\b|bg-brand-100\b', 'bg-surface'),
    (r'bg-brand-[2-9]00\b|bg-brand-950\b|bg-blue-500\b', 'bg-primary'),
    (r'bg-surface-sunken\b', 'bg-background'),
    (r'bg-surface-card\b', 'bg-surface'),
    (r'bg-bdr\b|bg-slate-100\b|bg-slate-200\b', 'bg-muted'),
    (r'bg-accent\b|bg-accent-(light|dark)\b', 'bg-secondary'),
    (r'bg-red-[5-7]00\b', 'bg-danger'),
    (r'bg-blue-50\b', 'bg-surface'),
    
    # Text colors
    (r'text-tx-primary\b', 'text-text'),
    (r'text-tx-secondary\b', 'text-secondary'),
    (r'text-tx-muted\b|text-gray-500\b|text-slate-500\b|text-slate-600\b', 'text-muted'),
    (r'text-brand-[1-4]00\b', 'text-secondary'),
    (r'text-brand-[5-9]00\b|text-brand-950\b|text-blue-600\b', 'text-primary'),
    (r'text-red-[5-7]00\b', 'text-danger'),
    (r'text-accent\b', 'text-secondary'),
    
    # Border colors
    (r'border-brand-[0-9]+\b', 'border-primary'),
    (r'border-bdr-strong\b', 'border-secondary'),
    (r'border-bdr\b', 'border-muted'),
    
    # Hover states overrides
    (r'hover:bg-brand-[0-9]+\b', 'hover:bg-primary'),
    (r'hover:text-brand-[0-9]+\b', 'hover:text-primary'),
    (r'hover:bg-surface-[a-z]+\b', 'hover:bg-background'),
    (r'hover:text-tx-[a-z]+\b', 'hover:text-text'),
    (r'hover:bg-red-[5-9]00\b', 'hover:bg-danger'),
    (r'hover:text-red-[5-9]00\b', 'hover:text-danger'),
    (r'hover:bg-slate-100\b', 'hover:bg-surface'),
    
    # Focus rings
    (r'focus:ring-brand-[0-9]+(/[0-9]+)?\b', 'focus:ring-primary'),
    (r'ring-brand-[0-9]+\b', 'ring-primary'),
    
    # Shadows
    (r'shadow-brand\b', 'shadow-lg'),
    
    # Edge case direct hex variables removed
    # Tailwind arbitrary hex like bg-[#2563EB] -> bg-primary
    (r'bg-\[\#2563EB\]', 'bg-primary'),
    (r'bg-\[\#DC2626\]', 'bg-danger'),
    (r'text-\[\#0F172A\]', 'text-text'),
    (r'text-\[\#475569\]', 'text-secondary'),
    (r'text-\[\#94A3B8\]', 'text-muted'),
]

processed_files = 0
changed_files = 0

for d in directories:
    for root, dirs, files in os.walk(d):
        for name in files:
            if not name.endswith(('.tsx', '.ts', '.css')):
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
                changed_files += 1
            processed_files += 1

print(f"Processed {processed_files} files.")
print(f"Updated {changed_files} files with new theme classes.")
