import os
import re

directories = ['app', 'components', 'lib']

# We are moving away from tailwind base colors (bg-primary, bg-surface) 
# towards explicit semantic roles: bg-[rgb(var(--card-bg))] etc

replacements = [
    # Alerts in components/ui/index.tsx
    (r"bg-primary/10 border-primary/20 text-text", r"bg-[rgb(var(--alert-info-bg)/0.1)] border-[rgb(var(--alert-info-border)/0.2)] text-[rgb(var(--alert-info-text))]"),
    (r"bg-secondary/10 border-secondary/20 text-secondary", r"bg-[rgb(var(--alert-warning-bg)/0.1)] border-[rgb(var(--alert-warning-border)/0.2)] text-[rgb(var(--alert-warning-text))]"),
    (r"bg-danger/10 border-danger/20 text-danger", r"bg-[rgb(var(--alert-error-bg)/0.1)] border-[rgb(var(--alert-error-border)/0.2)] text-[rgb(var(--alert-error-text))]"),
    
    # Specific Hardcoded tailwind defaults
    (r'(?<!-)bg-white/10\b', r'bg-[rgb(var(--card-bg)/0.1)]'),
    (r'(?<!-)border-white/10\b', r'border-[rgb(var(--card-border)/0.1)]'),
    (r'(?<!-)text-white\b', r'text-[rgb(var(--btn-primary-text))]'),
    
    # Text
    (r'text-text\b', r'text-[rgb(var(--text-primary))]'),
    (r'text-secondary\b(?!/)', r'text-[rgb(var(--text-secondary))]'),
    (r'text-muted\b', r'text-[rgb(var(--text-muted))]'),
    (r'text-danger\b', r'text-[rgb(var(--text-danger))]'),
    (r'text-primary\b', r'text-[rgb(var(--color-primary))]'), # general fallback
    (r'text-primary/([0-9]+)\b', r'text-[rgb(var(--color-primary)/0.\1)]'),
    (r'text-secondary/([0-9]+)\b', r'text-[rgb(var(--color-secondary)/0.\1)]'),

    # Backgrounds
    (r'bg-surface\b(?!/)', r'bg-[rgb(var(--card-bg))]'),
    (r'bg-background\b', r'bg-[rgb(var(--page-bg))]'),
    (r'bg-primary\b', r'bg-[rgb(var(--btn-primary-bg))]'),
    (r'bg-secondary\b(?!/)', r'bg-[rgb(var(--btn-secondary-bg))]'),
    (r'bg-danger\b', r'bg-[rgb(var(--btn-danger-bg))]'),
    
    # Hover states
    (r'hover:bg-primary\b', r'hover:bg-[rgb(var(--btn-primary-bg))]'),
    (r'hover:bg-surface\b', r'hover:bg-[rgb(var(--card-bg))]'),
    (r'hover:bg-background\b', r'hover:bg-[rgb(var(--page-bg))]'),
    (r'hover:text-primary\b', r'hover:text-[rgb(var(--color-primary))]'),
    (r'hover:text-text\b', r'hover:text-[rgb(var(--text-primary))]'),
    (r'hover:bg-secondary/([0-9]+)\b', r'hover:bg-[rgb(var(--color-secondary)/0.\1)]'),

    # Border
    (r'border-muted\b', r'border-[rgb(var(--card-border))]'),
    (r'border-secondary\b', r'border-[rgb(var(--input-border))]'),
    (r'border-primary\b', r'border-[rgb(var(--input-focus-ring))]'),
    
    # Opacities
    (r'bg-primary/([0-9]+)\b', r'bg-[rgb(var(--color-primary)/0.\1)]'),
    (r'bg-secondary/([0-9]+)\b', r'bg-[rgb(var(--color-secondary)/0.\1)]'),
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
            for pattern, replace in replacements:
                # Need to be extremely careful with things already containing var(--
                # We do this naive pass and see
                content = re.sub(pattern, replace, content)
                
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                changed_files += 1
            processed_files += 1

print(f"Processed {processed_files} files.")
print(f"Updated {changed_files} files with new arbitrary semantic classes.")
