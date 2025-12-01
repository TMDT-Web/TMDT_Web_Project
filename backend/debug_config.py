import sys
import os

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

try:
    print(f"RAW ALLOWED_ORIGINS: {os.environ.get('ALLOWED_ORIGINS')}")
    print(f"RAW ALLOWED_EXTENSIONS: {os.environ.get('ALLOWED_EXTENSIONS')}")
    from app.core.config import settings
    print("SUCCESS: Settings loaded successfully")
    print(f"ALLOWED_ORIGINS: {settings.ALLOWED_ORIGINS}")
    print(f"ALLOWED_EXTENSIONS: {settings.ALLOWED_EXTENSIONS}")
    print(f"SMTP_USER: {settings.SMTP_USER}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
