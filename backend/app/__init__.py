"""
Polyfill environment bootstrap for robust pure-Python execution on all OS environments.
"""
import sys
import types
import hashlib
import uuid

# Polyfill xxhash with standard hashlib if C-extension is blocked or missing
if 'xxhash' not in sys.modules:
    try:
        import xxhash
    except Exception:
        class PureXXHash:
            def __init__(self, data=b''):
                self._m = hashlib.md5(data if isinstance(data, bytes) else str(data).encode())
            def update(self, data):
                self._m.update(data if isinstance(data, bytes) else str(data).encode())
            def intdigest(self):
                return int(self._m.hexdigest(), 16)
            def hexdigest(self):
                return self._m.hexdigest()
            def digest(self):
                return self._m.digest()

        m = types.ModuleType('xxhash')
        m.xxh3_64 = lambda data=b'': PureXXHash(data)
        m.xxh64 = lambda data=b'': PureXXHash(data)
        m.xxh32 = lambda data=b'': PureXXHash(data)
        m.xxh128 = lambda data=b'': PureXXHash(data)
        m.xxh3_128 = lambda data=b'': PureXXHash(data)
        sys.modules['xxhash'] = m

# Polyfill uuid_utils if C-extension is blocked or missing
if 'uuid_utils' not in sys.modules:
    try:
        import uuid_utils
    except Exception:
        u = types.ModuleType('uuid_utils')
        u.UUID = uuid.UUID
        u.uuid4 = uuid.uuid4
        u.uuid7 = uuid.uuid4
        u.uuid1 = uuid.uuid1
        u.uuid3 = uuid.uuid3
        u.uuid5 = uuid.uuid5
        sys.modules['uuid_utils'] = u
        sys.modules['uuid_utils.compat'] = u
