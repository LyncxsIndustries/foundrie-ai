import re
import os

replacements = [
    (
        'docs/SECURITY_SCRIPT_OVERRIDES.md',
        'enforce the complete Node/npm runtime toolchain compatibility (e.g., `packageManager` and `engines.npm`)',
        'enforce the complete Node/npm runtime toolchain compatibility (Node >=20.17.0 and npm 11.17.0, via `packageManager` and `engines.npm`)'
    ),
    (
        'project-kit/context/architecture-context.md',
        'The toolchain requires a complete Node/npm pair enforced in CI (e.g., `packageManager` and `engines.npm`).',
        'The toolchain requires a complete Node/npm pair enforced in CI (Node >=20.17.0 and npm 11.17.0, via `packageManager` and `engines.npm`).'
    ),
    (
        'project-kit/feature-specs/62-security-script-fix.md',
        'CI validation must enforce this full Node/npm pair.',
        'CI validation must enforce this full Node/npm pair (Node >=20.17.0 and npm 11.17.0).'
    ),
    (
        'research/NPM_SECURITY_OVERRIDE_AUDIT.md',
        'enforce full Node/npm runtime toolchain compatibility (e.g., `packageManager` and `engines.npm`)',
        'enforce full Node/npm runtime toolchain compatibility (Node >=20.17.0 and npm 11.17.0, via `packageManager` and `engines.npm`)'
    )
]

for file_path, target, replacement in replacements:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
        content = content.replace(target, replacement)
        with open(file_path, 'w') as f:
            f.write(content)
