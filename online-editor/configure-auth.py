"""Receive GitHub App credentials over stdin; never print or commit them."""
import json
import os
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile

root = Path('/opt/profile-editor')
incoming = json.load(sys.stdin)
expected = {'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'}
if set(incoming) != expected or any(
    not isinstance(value, str) or not value or len(value) > 256
    or any(char not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-' for char in value)
    for value in incoming.values()
):
    raise SystemExit('Invalid credential format')

values = {}
filename = root / '.env'
if filename.exists():
    for line in filename.read_text().splitlines():
        key, separator, value = line.partition('=')
        if separator and key in expected | {'SESSION_SECRET'}:
            values[key] = value
values.update(incoming)
values.setdefault('SESSION_SECRET', secrets.token_urlsafe(32))
fd, temporary = tempfile.mkstemp(prefix='.env.', dir=root)
try:
    with os.fdopen(fd, 'w') as stream:
        stream.write(''.join(f'{key}={value}\n' for key, value in values.items()))
    os.replace(temporary, filename)
finally:
    if os.path.exists(temporary):
        os.unlink(temporary)

subprocess.run(['docker', 'compose', '-f', str(root / 'online-editor/compose.yml'),
                'up', '-d', '--no-build', '--force-recreate'], check=True,
               stdout=subprocess.DEVNULL)
print('GitHub login configured')
