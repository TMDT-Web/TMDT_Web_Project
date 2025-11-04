# 🐳 Hướng dẫn chạy ứng dụng với Docker

## 📋 Yêu cầu

- Docker Desktop đã cài đặt và đang chạy
- Docker Compose (đi kèm với Docker Desktop)

## 🚀 Cách chạy

### Bước 1: Mở terminal tại thư mục backend

```bash
cd backend
```

### Bước 2: Khởi động Docker containers

```bash
docker-compose up -d
```

Lệnh này sẽ:

- ✅ Tải PostgreSQL 15 image
- ✅ Tạo database container (`furniture_db`)
- ✅ Build backend API image
- ✅ Tạo API container (`furniture_api`)
- ✅ Tự động chạy migrations và tạo database schema

### Bước 3: Kiểm tra containers đang chạy

```bash
docker-compose ps
```

Bạn sẽ thấy:

```
NAME              IMAGE               STATUS
furniture_api     backend_api         Up
furniture_db      postgres:15         Up (healthy)
```

### Bước 4: Xem logs

```bash
# Xem tất cả logs
docker-compose logs -f

# Chỉ xem logs của API
docker-compose logs -f api

# Chỉ xem logs của Database
docker-compose logs -f db
```

### Bước 5: Truy cập ứng dụng

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Database**: localhost:5432

## 🛠️ Các lệnh hữu ích

### Dừng containers (giữ dữ liệu)

```bash
docker-compose stop
```

### Khởi động lại containers

```bash
docker-compose start
```

### Dừng và xóa containers (giữ volumes/data)

```bash
docker-compose down
```

### Dừng và xóa hoàn toàn (bao gồm volumes/data)

```bash
docker-compose down -v
```

### Rebuild containers sau khi thay đổi code

```bash
docker-compose up -d --build
```

### Chạy migrations

```bash
docker-compose exec api alembic upgrade head
```

### Tạo migration mới

```bash
docker-compose exec api alembic revision --autogenerate -m "Your message"
```

### Truy cập vào container để chạy lệnh

```bash
# Vào API container
docker-compose exec api bash

# Vào Database container
docker-compose exec db psql -U furniture_user -d furniture_db
```

### Reset database hoàn toàn

```bash
docker-compose down -v
docker-compose up -d
```

## 🔧 Cấu hình

### Database trong Docker

**Thông tin kết nối:**

- Host: `db` (trong Docker network) hoặc `localhost` (từ máy host)
- Port: `5432`
- Username: `furniture_user`
- Password: `123456`
- Database: `furniture_db`

**DATABASE_URL trong `.env`:**

```env
DATABASE_URL=postgresql+psycopg://furniture_user:123456@db:5432/furniture_db
```

### CORS Configuration

Backend đã được cấu hình CORS trong `.env`:

```env
CORS_ALLOW_ORIGINS=http://localhost:5173
```

## 📊 Thêm dữ liệu mẫu

### Cách 1: Sử dụng API

Truy cập http://localhost:8000/api/docs và sử dụng Swagger UI để:

1. Tạo tài khoản admin
2. Đăng nhập
3. Thêm categories
4. Thêm products

### Cách 2: Import từ SQL file

```bash
docker-compose exec db psql -U furniture_user -d furniture_db < your_data.sql
```

### Cách 3: Chạy Python script trong container

```bash
docker-compose exec api python scripts/seed_data.py
```

## 🐛 Troubleshooting

### Container không khởi động được

**Kiểm tra logs:**

```bash
docker-compose logs api
docker-compose logs db
```

### Database connection error

**Kiểm tra database đã ready chưa:**

```bash
docker-compose exec db pg_isready -U furniture_user
```

**Restart containers:**

```bash
docker-compose restart
```

### Port đã được sử dụng

Nếu port 8000 hoặc 5432 đã được dùng:

**Cách 1: Tìm và tắt process đang dùng port**

```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :8000
kill -9 <PID>
```

**Cách 2: Đổi port trong docker-compose.yml**

```yaml
ports:
  - "8001:8000" # Đổi 8000 thành 8001
```

### Cần reset hoàn toàn

```bash
# Xóa containers, volumes, và networks
docker-compose down -v

# Xóa images (nếu cần)
docker rmi backend_api

# Build và start lại
docker-compose up -d --build
```

## 🎯 Frontend kết nối với Backend trong Docker

Frontend vẫn chạy ngoài Docker, cần cấu hình `.env`:

```env
# frontend/.env
VITE_API_URL=http://localhost:8000/api
```

Sau đó chạy frontend:

```bash
cd frontend
npm run dev
```

## 📝 Lưu ý quan trọng

1. **Dữ liệu được lưu trong Docker volumes** - Sẽ không mất khi restart containers
2. **Chỉ mất dữ liệu khi chạy** `docker-compose down -v`
3. **Code changes sẽ tự reload** nhờ volume mount và `--reload` flag
4. **Database port 5432 được expose** - Có thể kết nối từ tools như pgAdmin
5. **Logs được lưu** và có thể xem bằng `docker-compose logs`

## ✅ Checklist khởi động

- [ ] Docker Desktop đang chạy
- [ ] Đã vào thư mục `backend`
- [ ] File `.env` đã cấu hình đúng
- [ ] Chạy `docker-compose up -d`
- [ ] Kiểm tra `docker-compose ps` - tất cả containers đều Up
- [ ] Truy cập http://localhost:8000/api/docs - Swagger UI hiển thị
- [ ] Frontend chạy `npm run dev`
- [ ] Truy cập http://localhost:5173 - Trang web hoạt động

🎉 Xong! Ứng dụng của bạn đã chạy trên Docker!
