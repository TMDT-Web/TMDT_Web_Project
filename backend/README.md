# Backend structure (FastAPI – C2C Marketplace)

Cấu trúc đề xuất theo hướng tách biệt layer (API/Service/Repository), dễ mở rộng và test:

backend/
  app/
    main.py
    api/
      dependencies.py
      v1/
        routers/
          health.py
    core/
      config.py
      security.py
      logging.py
      events.py
    db/
      base.py
      session.py
      init_db.py
    models/
    repositories/
    services/
    schemas/
    utils/
  migrations/
  tests/
    conftest.py
    api/
    services/
    repositories/
    factories/
  scripts/
  .env.example
  alembic.ini
  requirements.txt

Nguyên tắc:
- Router chỉ xử lý HTTP và gọi service.
- Service chứa nghiệp vụ, gọi repository.
- Repository thao tác DB qua SQLAlchemy (async).
- Schemas (Pydantic) tách khỏi models DB.
- Config dùng pydantic-settings, đọc từ .env.
