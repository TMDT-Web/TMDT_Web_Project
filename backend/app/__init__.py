"""
LuxeFurniture Backend Application
Import all models to ensure they're registered with SQLAlchemy Base
"""
__version__ = "1.0.0"

# Import all models to register with Base
from app.models import user, product, order, cart, chat, address  # noqa
