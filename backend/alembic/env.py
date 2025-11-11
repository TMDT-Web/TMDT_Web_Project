# backend/alembic/env.py
from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# --- Bootstrap PYTHONPATH để 'from app ...' luôn chạy được khi gọi alembic từ CLI
# Thư mục hiện tại là: backend/alembic/ -> đẩy ../ (backend) vào sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

# ---- Import app settings/metadata
from app.core.config import settings
from app.core.database import Base

# Đảm bảo metadata có đầy đủ bảng bằng cách import models
# Nếu bạn đã gom hết models trong app.core.models thì dòng dưới là đủ.
try:
    from app.core import models as _core_models  # noqa: F401
except Exception:
    pass

# Nếu dự án chia models theo module, có thể giữ try/except để tránh lỗi khi thiếu module
for _mod in (
    "app.users.models",
    "app.products.models",
    "app.orders.models",
    "app.cart.models",
    "app.inventory.models",
    "app.payments.models",
    "app.rewards.models",
):
    try:
        __import__(_mod)
    except Exception:
        # Bỏ qua nếu module không tồn tại; mục tiêu chỉ là load metadata
        pass

# ---- Alembic config
config = context.config

# Ưu tiên effective_database_url khi chạy ở môi trường test; fallback database_url
db_url = getattr(settings, "effective_database_url", None) or settings.database_url
config.set_main_option("sqlalchemy.url", str(db_url))

# Logging cấu hình từ alembic.ini (nếu có)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata đích để autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Chạy migration ở chế độ offline (không cần DB connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,  # theo dõi thay đổi kiểu dữ liệu cột
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Chạy migration ở chế độ online (có DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),  # type: ignore[arg-type]
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,  # theo dõi thay đổi kiểu dữ liệu cột
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
