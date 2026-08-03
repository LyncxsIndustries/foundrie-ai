import json

with open('package-lock.json', 'r') as f:
    lock = json.load(f)

if '' in lock.get('packages', {}):
    if 'engines' in lock['packages']['']:
        lock['packages']['']['engines']['npm'] = '>=11.17.0'
        lock['packages']['']['engines']['node'] = '>=20.17.0'

with open('package-lock.json', 'w') as f:
    json.dump(lock, f, indent=2)
