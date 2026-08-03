import re
import os

files_to_update = [
    'docs/SECURITY_SCRIPT_OVERRIDES.md',
    'project-kit/context/architecture-context.md',
    'project-kit/feature-specs/62-security-script-fix.md',
    'research/NPM_SECURITY_OVERRIDE_AUDIT.md',
    'project-kit/context/library-docs.md',
    'project-kit/context/progress-tracker.md',
    'docs/DEPENDENCIES_UPGRADE_NOTES.md'
]

for file_path in files_to_update:
    if not os.path.exists(file_path): continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace node >=20.9.0 with >=20.17.0
    content = content.replace('>=20.9.0', '>=20.17.0')
    
    # In feature 62, there's a reference to "engines.node declares >=20.9.0". Also need to ensure npm is pinned.
    
    with open(file_path, 'w') as f:
        f.write(content)
