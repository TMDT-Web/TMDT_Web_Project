# 🚀 Hướng dẫn Setup và Chạy Project

## 📋 Yêu cầu
- Docker Desktop đã cài và đang chạy
- Git
- PowerShell (Windows) hoặc Terminal (Mac/Linux)

## 🔧 Lần đầu setup (hoặc sau khi pull code mới)

### 1. Clone repository
```bash
git clone <repository-url>
cd TMDT_Web_Project
```

### 2. Tạo file .env cho backend (nếu chưa có)
```bash
# Tạo file backend/.env
cd backend
cp .env.example .env  # Hoặc tạo thủ công
```

Nội dung file `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres123@db:5432/luxefurniture
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-super-secret-key-change-in-production
ENVIRONMENT=development
FRONTEND_BASE_URL=http://localhost:3000

# Payment credentials (nếu có)
VNPAY_TMN_CODE=your_vnpay_code
VNPAY_HASH_SECRET=your_vnpay_secret
MOMO_PARTNER_CODE=your_momo_code
MOMO_ACCESS_KEY=your_momo_key
```

### 3. Build và chạy tất cả services
```bash
# Quay về root directory
cd ..

# Build và start tất cả containers
docker-compose up -d --build
```

Lệnh này sẽ:
- Build backend image
- Build frontend image  
- Start PostgreSQL database
- Start Redis cache
- Start backend API (port 8000)
- Start frontend web (port 3000)

### 4. Chờ services khởi động
```bash
# Xem logs để kiểm tra
docker-compose logs -f

# Hoặc xem logs từng service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5. Chạy database migration (lần đầu)
```bash
# Vào container backend
docker exec -it luxefurniture_backend bash

# Chạy migrations
alembic upgrade head

# Thoát container
exit
```

### 6. (Optional) Seed dữ liệu mẫu
```bash
docker exec -it luxefurniture_backend python -m app.scripts.seed_data
```

### 7. Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432 (user: postgres, pass: postgres123)
- **Redis**: localhost:6379

## 🔄 Chạy hàng ngày (sau khi đã setup)

### Start tất cả services
```bash
docker-compose up -d
```

### Stop tất cả services
```bash
docker-compose down
```

### Restart một service cụ thể
```bash
docker-compose restart backend
docker-compose restart frontend
```

## 🛠️ Khi có code mới (sau git pull)

### 1. Pull code mới
```bash
git pull origin main
```

### 2. Rebuild và restart
```bash
# Rebuild cả 2 services
docker-compose up -d --build

# Hoặc rebuild từng service
docker-compose build backend
docker-compose build frontend
docker-compose up -d
```

### 3. Chạy migrations mới (nếu có)
```bash
docker exec -it luxefurniture_backend alembic upgrade head
```

## 🐛 Debug và Troubleshooting

### Xem logs
```bash
# Tất cả services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only  
docker-compose logs -f frontend

# Database
docker-compose logs -f db
```

### Vào container để debug
```bash
# Backend
docker exec -it luxefurniture_backend bash

# Frontend
docker exec -it luxefurniture_frontend sh

# Database
docker exec -it luxefurniture_db psql -U postgres -d luxefurniture
```

### Reset toàn bộ (xóa data)
```bash
# Stop và xóa containers + volumes
docker-compose down -v

# Build lại và start
docker-compose up -d --build

# Chạy lại migrations
docker exec -it luxefurniture_backend alembic upgrade head
```

### Clear cache và rebuild
```bash
# Xóa images cũ
docker-compose down --rmi all

# Build lại không dùng cache
docker-compose build --no-cache

# Start
docker-compose up -d
```

## 📝 Các lệnh hữu ích khác

### Kiểm tra trạng thái containers
```bash
docker-compose ps
```

### Xem resource usage
```bash
docker stats
```

### Backup database
```bash
docker exec luxefurniture_db pg_dump -U postgres luxefurniture > backup.sql
```

### Restore database
```bash
docker exec -i luxefurniture_db psql -U postgres luxefurniture < backup.sql
```

## 🔐 Tài khoản mặc định (sau seed data)

### Admin
- Email: admin@luxefurniture.com
- Password: admin123

### Customer
- Email: customer@example.com
- Password: customer123

## 📞 Payment Testing

### VNPay Test Cards
- Card: 9704198526191432198
- Name: NGUYEN VAN A
- Date: 07/15
- OTP: 123456

### Momo Test
- Phone: 0123456789
- OTP: Nhận từ app Momo test

## ⚠️ Lưu ý quan trọng

1. **Luôn chạy migrations** sau khi pull code mới có thay đổi database
2. **Rebuild images** khi có thay đổi dependencies (requirements.txt, package.json)
3. **Clear browser cache** nếu frontend không cập nhật
4. **Kiểm tra Docker Desktop** đang chạy trước khi start
5. **Port conflicts**: Đảm bảo ports 3000, 8000, 5432, 6379 không bị chiếm dụng

## 🎯 Quick Start Script

Tạo file `start.ps1` (Windows PowerShell):
```powershell
# Check Docker is running
if (!(docker info 2>$null)) {
    Write-Host "Docker is not running. Please start Docker Desktop first!" -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "Starting all services..." -ForegroundColor Green
docker-compose up -d

# Wait for backend to be ready
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Open browser
Write-Host "Opening application in browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "Application is ready!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
```

Chạy: `.\start.ps1`
