import re

filepath = r'd:\Projects\EMS\Files\Adarsh Final 28-3\Frontend\app\globals.css'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

# body mapping
text = text.replace('background: rgb(var(--color-background));', 'background: rgb(var(--page-bg));')
text = text.replace('color: rgb(var(--color-text));', 'color: rgb(var(--page-text));')

# scrollbar mapping
text = text.replace('background: rgb(var(--color-muted));', 'background: rgb(var(--card-border));') # approximate
text = text.replace('background: rgb(var(--color-primary));', 'background: rgb(var(--btn-primary-bg));')
text = text.replace('outline: 2px solid rgb(var(--color-primary));', 'outline: 2px solid rgb(var(--input-focus-ring));')

# .btn-primary
btn_primary = r'''@apply inline-flex items-center gap-2 px-5 py-2.5 bg-\[rgb\(var\(--btn-primary-bg\)\)\] text-\[rgb\(var\(--btn-primary-text\)\)\] rounded-xl
           font-semibold text-sm hover:bg-\[rgb\(var\(--btn-primary-bg\)\)] active:scale-\[0.98\]
           transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg;'''

text = re.sub(r'@apply inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white[^\;]+;', btn_primary, text)

# .btn-secondary
btn_secondary = r'''@apply inline-flex items-center gap-2 px-5 py-2.5 bg-\[rgb\(var\(--btn-secondary-bg\)\)\] border border-\[rgb\(var\(--btn-secondary-border\)\)\]
           text-\[rgb\(var\(--btn-secondary-text\)\)\] rounded-xl font-semibold text-sm hover:bg-\[rgb\(var\(--btn-secondary-hover-bg\)\)\]
           active:scale-\[0.98\] transition-all duration-150;'''
text = re.sub(r'@apply inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-muted[^\;]+;', btn_secondary, text)

# .btn-ghost
btn_ghost = r'''@apply inline-flex items-center gap-2 px-4 py-2 text-\[rgb\(var\(--btn-ghost-text\)\)\] rounded-xl
           font-medium text-sm hover:bg-\[rgb\(var\(--btn-ghost-hover-bg\)\)\] active:scale-\[0.98\] transition-all duration-150;'''
text = re.sub(r'@apply inline-flex items-center gap-2 px-4 py-2 text-secondary rounded-xl[^\;]+;', btn_ghost, text)

# .btn-danger
btn_danger = r'''@apply inline-flex items-center gap-2 px-5 py-2.5 bg-\[rgb\(var\(--btn-danger-bg\)\)\] text-\[rgb\(var\(--btn-danger-text\)\)\] rounded-xl
           font-semibold text-sm hover:opacity-90 active:scale-\[0.98\] transition-all duration-150;'''
text = re.sub(r'@apply inline-flex items-center gap-2 px-5 py-2.5 bg-danger text-white[^\;]+;', btn_danger, text)

# .card
text = text.replace('@apply bg-white rounded-2xl border border-muted shadow-card;', '@apply bg-[rgb(var(--card-bg))] rounded-2xl border border-[rgb(var(--card-border))] shadow-card;')

# .input
text = re.sub(r'@apply w-full px-4 py-2\.5 bg-white border border-secondary rounded-xl text-sm\s*focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary\s*placeholder:text-muted transition-colors;',
    r'@apply w-full px-4 py-2.5 bg-[rgb(var(--input-bg))] border border-[rgb(var(--input-border))] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--input-focus-ring))] focus:border-[rgb(var(--input-focus-ring))] placeholder:text-[rgb(var(--input-placeholder))] text-[rgb(var(--input-text))] transition-colors;', text)
text = text.replace('@apply border-red-400 focus:ring-red-200 focus:border-red-500;', '@apply border-[rgb(var(--input-error-border))] focus:ring-[rgb(var(--input-error-border))] focus:border-[rgb(var(--input-error-border))];')
text = text.replace('.label { @apply block text-sm font-medium text-text mb-1.5; }', '.label { @apply block text-sm font-medium text-[rgb(var(--text-primary))] mb-1.5; }')
text = text.replace('.error-msg { @apply text-xs text-danger mt-1; }', '.error-msg { @apply text-xs text-[rgb(var(--text-danger))] mt-1; }')

# .nav-item
text = re.sub(r'@apply flex items-center gap-3 px-3 py-2\.5 rounded-xl text-sm font-medium\s*text-secondary hover:bg-surface hover:text-primary transition-colors cursor-pointer;',
    r'@apply flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--nav-item-text))] hover:bg-[rgb(var(--nav-item-hover-bg))] hover:text-[rgb(var(--nav-item-hover-text))] transition-colors cursor-pointer;', text)
text = text.replace('@apply bg-surface text-primary font-semibold;', '@apply bg-[rgb(var(--nav-item-active-bg))] text-[rgb(var(--nav-item-active-text))] font-semibold;')

# .page-title, .page-subtitle
text = text.replace('.page-title { @apply text-2xl font-display font-bold text-text; }', '.page-title { @apply text-2xl font-display font-bold text-[rgb(var(--text-primary))]; }')
text = text.replace('.page-subtitle { @apply text-sm text-secondary mt-1; }', '.page-subtitle { @apply text-sm text-[rgb(var(--text-secondary))] mt-1; }')

# .ems-table
text = text.replace('.table-wrap { @apply w-full overflow-x-auto rounded-2xl border border-muted; }', '.table-wrap { @apply w-full overflow-x-auto rounded-2xl border border-[rgb(var(--table-border))]; }')
text = re.sub(r'@apply px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider\s*bg-background border-b border-muted;',
    r'@apply px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--table-header-text))] uppercase tracking-wider bg-[rgb(var(--table-header-bg))] border-b border-[rgb(var(--table-border))];', text)
text = text.replace('.ems-table td { @apply px-4 py-3.5 border-b border-muted text-text; }', '.ems-table td { @apply px-4 py-3.5 border-b border-[rgb(var(--table-border))] text-[rgb(var(--table-text))]; }')
text = text.replace('.ems-table tbody tr:hover td { @apply bg-surface/40; }', '.ems-table tbody tr:hover td { @apply bg-[rgb(var(--table-row-hover))]; opacity: 0.8; }')

# sections
text = text.replace('.section-title {\n    @apply text-xl font-display font-bold text-text;\n  }', '.section-title {\n    @apply text-xl font-display font-bold text-[rgb(var(--text-primary))];\n  }')
text = text.replace('.divider { @apply border-t border-muted my-6; }', '.divider { @apply border-t border-[rgb(var(--card-border))] my-6; }')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

