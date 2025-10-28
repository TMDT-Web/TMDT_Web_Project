import os
import time
import pytest

from fastapi.testclient import TestClient

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine import make_url
import sqlalchemy

# app chính
from app.main import app

# cố gắng import get_db để override (nếu path khác, sửa tại đây)
try:
    from app.core.database import get_db
    HAVE_GET_DB = True
except Exception:
    HAVE_GET_DB = False

# --- Cấu hình DB test ---
DEFAULT_TEST_DSN = "postgresql+psycopg://furniture_user:secretpassword@db:5432/furniture_test_db"
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", DEFAULT_TEST_DSN)


def _create_test_database_if_needed():
    """
    Tự tạo database test nếu chưa tồn tại, không cần lệnh thủ công.
    Sử dụng TEST_DATABASE_URL để suy ra admin URL (database=postgres).
    """
    url = make_url(TEST_DATABASE_URL)
    db_name = url.database
    admin_url = url.set(database="postgres")  # kết nối tới 'postgres' để CREATE DATABASE

    admin_engine = create_engine(admin_url)
    with admin_engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            conn.execute(text(f"CREATE DATABASE {db_name} WITH OWNER {url.username}"))
            print(f"Created test database: {db_name}")
        except sqlalchemy.exc.ProgrammingError:
            # đã tồn tại -> bỏ qua
            print(f"Test database already exists: {db_name}")
    admin_engine.dispose()


def _alembic_upgrade():
    """
    Chạy alembic upgrade head vào DB test.
    Đặt DATABASE_URL = TEST_DATABASE_URL để env.py đọc đúng.
    """
    os.environ.setdefault("PYTHONPATH", "/app")
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    rc = os.system("alembic upgrade head")
    if rc != 0:
        raise RuntimeError("Alembic upgrade failed")


@pytest.fixture(scope="session", autouse=True)
def _bootstrap_db():
    """
    - Tự tạo DB test nếu chưa có
    - Chạy alembic migrate
    """
    _create_test_database_if_needed()
    _alembic_upgrade()
    time.sleep(0.3)
    yield


@pytest.fixture
def client():
    """
    TestClient dùng Session trỏ tới TEST_DATABASE_URL (DB test).
    """
    engine = create_engine(TEST_DATABASE_URL, future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    def _get_db_override():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    if HAVE_GET_DB:
        app.dependency_overrides[get_db] = _get_db_override

    with TestClient(app) as c:
        yield c

    if HAVE_GET_DB:
        app.dependency_overrides.clear()


@pytest.fixture
def api_prefix():
    # prefix đọc từ env (main.py dùng config.settings.api_prefix mặc định '/api')
    return os.getenv("API_PREFIX", "/api")

def _reset_test_schema_if_requested():
    """
    Cho phép xóa toàn bộ schema 'public' trong DB test trước khi migrate,
    chỉ khi đặt RESET_TEST_DB=1. Mặc định không làm gì.
    """
    if os.getenv("RESET_TEST_DB", "0") != "1":
        return
    print("Resetting test database schema (DROP SCHEMA public CASCADE; CREATE SCHEMA public;)")
    engine = create_engine(TEST_DATABASE_URL, future=True)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
    engine.dispose()
    print("Schema reset complete.")

def _alembic_upgrade():
    """
    Chạy alembic upgrade head vào DB test.
    Đặt DATABASE_URL = TEST_DATABASE_URL để env.py đọc đúng.
    """
    os.environ.setdefault("PYTHONPATH", "/app")
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    rc = os.system("alembic upgrade head")
    if rc != 0:
        raise RuntimeError("Alembic upgrade failed")

@pytest.fixture(scope="session", autouse=True)
def _bootstrap_db():
    """
    - Tự tạo DB test nếu chưa có
    - (tuỳ chọn) Reset schema nếu RESET_TEST_DB=1
    - Chạy alembic migrate
    """
    _create_test_database_if_needed()
    _reset_test_schema_if_requested()   # <--- thêm dòng này
    _alembic_upgrade()
    time.sleep(0.3)
    yield