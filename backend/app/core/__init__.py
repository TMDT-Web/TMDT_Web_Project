"""
Core package exports.

Keep this file minimal to avoid circular imports when importing
submodules like `app.core.database` from other packages (e.g. models).
Import higher-level dependency helpers directly from their modules
instead of exposing them via this package-level import.
"""

from .database import get_db
