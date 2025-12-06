# LUXE FURNITURE - Docker Setup Guide

## 🐳 Chạy Project với Docker

Project này hỗ trợ chạy hoàn toàn trên Docker với 3 services:
- **Database**: PostgreSQL 15
- **Backend API**: FastAPI
- **Frontend**: React Router v7

## 📋 Prerequisites

- Docker Desktop installed
- Docker Compose V2

## 🚀 Quick Start

### 1. Production Mode (Recommended)

Chạy toàn bộ stack ở production mode:

```bash
# Build và start tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services sẽ chạy tại:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/v1/docs
- **Database**: localhost:5432

### 2. Development Mode (With Hot Reload)

Chạy ở development mode với hot-reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Xem logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

Services sẽ chạy tại:
- **Frontend (Vite)**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432

## 📦 Services Details

### Database (PostgreSQL)
- **Container**: `furniture_db`
- **Port**: 5432
- **Credentials**:
  - User: `furniture_user`
  - Password: `123456`
  - Database: `furniture_db`
- **Health Check**: Enabled
- **Data Persistence**: Volume `postgres_data`

### Backend API (FastAPI)
- **Container**: `furniture_api`
- **Port**: 8000
- **Auto-reload**: ✅ (dev mode)
- **Dependencies**: PostgreSQL
- **CORS**: Configured for frontend

### Frontend (React Router v7)
- **Container**: `furniture_frontend`
- **Port**: 
  - Production: 3000
  - Development: 5173
- **Hot Reload**: ✅ (dev mode)
- **API Connection**: Automatic

## 🔧 Common Commands

### Build Services
```bash
# Build tất cả
docker-compose build

# Build riêng lẻ
docker-compose build frontend
docker-compose build api
```

### Manage Services
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart frontend
docker-compose restart api

# View logs
docker-compose logs -f
docker-compose logs -f frontend
docker-compose logs -f api
```

### Database Management
```bash
# Access PostgreSQL
docker exec -it furniture_db psql -U furniture_user -d furniture_db

# Run migrations
docker-compose exec api alembic upgrade head

# Create new migration
docker-compose exec api alembic revision --autogenerate -m "description"
```

### Shell Access
```bash
# Backend shell
docker-compose exec api /bin/bash

# Frontend shell
docker-compose exec frontend /bin/sh

# Database shell
docker exec -it furniture_db psql -U furniture_user -d furniture_db
```

## 🧹 Cleanup

```bash
# Stop và xóa containers
docker-compose down

# Xóa cả volumes (⚠️ sẽ mất data)
docker-compose down -v

# Xóa cả images
docker-compose down --rmi all

# Full cleanup
docker-compose down -v --rmi all --remove-orphans
```

## 🔍 Troubleshooting

### Frontend không kết nối được Backend

Kiểm tra CORS settings trong `backend/app/core/config.py`:
```python
cors_allow_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]
```

### Database connection failed

Đợi database health check pass:
```bash
docker-compose logs db
```

### Port đã được sử dụng

Thay đổi ports trong `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Frontend
  - "8001:8000"  # Backend
  - "5433:5432"  # Database
```

### Hot reload không hoạt động

Kiểm tra volumes mapping:
```bash
docker-compose -f docker-compose.dev.yml up -d --force-recreate
```

## 📊 Health Checks

Tất cả services đều có health checks:

```bash
# Check status
docker-compose ps

# Chi tiết health
docker inspect furniture_api | grep -A 10 Health
```

## 🔐 Environment Variables

### Backend (.env trong /backend)
```env
DATABASE_URL=postgresql+psycopg://furniture_user:123456@db:5432/furniture_db
SECRET_KEY=your-secret-key
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend
```env
VITE_API_URL=http://localhost:8000
```

## 🎯 Best Practices

1. **Development**: Dùng `docker-compose.dev.yml` để code với hot-reload
2. **Testing**: Build production image trước khi deploy
3. **Production**: Sử dụng `docker-compose.yml` chính
4. **Logs**: Thường xuyên check logs khi debug
5. **Cleanup**: Định kỳ cleanup unused images/volumes

## 📝 Notes

- Frontend Dockerfile sử dụng **multi-stage build** để optimize size
- Development mode mount source code vào container cho hot-reload
- Production mode copy built files, không mount volumes
- Database data được persist qua volumes
- Network `furniture-net` cho phép services communicate

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs: `docker-compose logs -f`
2. Verify health: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Rebuild nếu cần: `docker-compose up -d --build`
