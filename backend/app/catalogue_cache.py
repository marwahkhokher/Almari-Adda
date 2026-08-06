"""
Shared catalogue cache, importable by any router that needs to
invalidate it after writing to items or item_metadata. Keeping this
in its own module (instead of a global in main.py) lets other route
files invalidate the cache without a circular import back to main.
"""

_cache = {"items": None}


def get_cache():
    return _cache["items"]


def set_cache(value):
    _cache["items"] = value


def clear_cache():
    _cache["items"] = None
