import os
import re

directories = ['components', 'app']

# Target arrays that might be null
target_vars = [
    'events', 'ongoingEvents', 'upcomingEvents', 'pastEvents', 
    'activeEvents', 'recentEvents', 'myEvents', 'venues', 
    'filtered', 'filteredEvents', 'history', 'logs', 'clubs', 
    'users', 'myRegs', 'upcoming', 'items', 'docs', 'links', 
    'sponsors', 'genPhotos', 'pending', 'approvals', 'navItems',
    'options', 'tabs', 'roleMenuItems'
]

# Regex patterns to find var.map and var.length
# (?<!\?)\. means "a dot not preceded by a question mark"
# We match the variable name exactly using \b (word boundary)
for var in target_vars:
    # Compile regexes for this specific variable
    # e.g., \bevents(?<!\?)\.map\(  -> needs to be replaced with events?.map(
    # Actually wait: \bevents\.map\(  and we check if the char before . is ?
    # Better: \b(var)\.(map|length)\b
    pass

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    for var in target_vars:
        # Match var.map or var.length that is NOT var?.map or var?.length
        # Using negative lookbehind for ? is not strictly needed if we just match `var\.`
        # Because `var?\.` wouldn't match `var\.`
        pattern_map = r'\b' + var + r'\.map\b'
        content = re.sub(pattern_map, var + r'?.map', content)
        
        pattern_length = r'\b' + var + r'\.length\b'
        content = re.sub(pattern_length, var + r'?.length', content)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Patched: {filepath}")

for d in directories:
    for root, dirs, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                patch_file(os.path.join(root, file))

print("Patching complete.")
