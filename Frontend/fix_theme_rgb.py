import re
import os

# 1. Update theme.css
filepath = r'd:\Projects\EMS\Files\Adarsh Final 28-3\Frontend\app\styles\theme.css'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r':\s*var\(--([a-zA-Z0-9_-]+)\);', r': rgb(var(--\1));', text)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)


# 2. Update all codebase arbitrary values from [rgb(var(--var))] to [var(--var)]
# Because if the CSS variable itself has `rgb()`, injecting `rgb()` inline causes `rgb(rgb())` CSS compilation errors.
directories = ['app', 'components', 'lib']

processed_files = 0
changed_files = 0

for d in directories:
    for root, dirs, files in os.walk(d):
        for name in files:
            if not name.endswith(('.tsx', '.ts', '.css')):
                continue
                
            fp = os.path.join(root, name)
            with open(fp, 'r', encoding='utf-8') as f:
                content = f.read()
                
            original_content = content
            
            # Note: We must NOT replace the BASE rgb() wrappers.
            # Base variables like `--color-primary` are NOT wrapped in rgb() in theme.css.
            # So `[rgb(var(--color-primary)/0.1)]` must stay as is if the variable is `-color-`.
            # BUT semantic variables like `--card-bg` have `rgb(var(...))` already.
            
            # Actually, if we use opacity modifiers like `bg-[var(--card-bg)/0.5]`, wait.
            # If `--card-bg` is `rgb(255 255 255)`, then `var(--card-bg)/0.5` gives `rgb(255 255 255)/0.5`.
            # This is NOT valid Tailwind or CSS! CSS needs `rgb(255 255 255 / 0.5)`.
            # If `--card-bg` is `rgb(255 255 255)`, you cannot append opacity to it dynamically via tailwind like `bg-card-bg/50`.
            # This is exactly why my initial approach stored RGB spaced values and wrapped them inline!
            # BUT, the user's explicit prompt dictates the theme.css structure MUST be `rgb()`.

            # We'll just replace `[rgb(var(--` with `[var(--` for any variable EXCEPT base colors (--color-*)
            
            # e.g text-[rgb(var(--text-primary))] -> text-[var(--text-primary)]
            content = re.sub(r'\[rgb\(var\(--(?!color-)([a-zA-Z0-9_-]+)\)\)\]', r'[var(--\1)]', content)
            
            # Also for globals.css 
            # e.g color: rgb(var(--page-text)) -> color: var(--page-text)
            content = re.sub(r'rgb\(var\(--(?!color-)([a-zA-Z0-9_-]+)\)\)', r'var(--\1)', content)
            
            if content != original_content:
                with open(fp, 'w', encoding='utf-8') as f:
                    f.write(content)
                changed_files += 1

print(f"Updated theme.css and removed redundant rgb() wrappers in {changed_files} files.")
