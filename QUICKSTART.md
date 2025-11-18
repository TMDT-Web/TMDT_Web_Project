# 🚀 Quick Start - Chạy Project với Docker

## TÓM TẮT NHANH

```bash
# 1. Clone repo (nếu chưa có)
git clone <repo-url>
cd TMDT_Web_Project

# 2. Tạo file .env cho backend
cd backend
cp .env.example .env  # hoặc tạo file .env mới

# 3. Chạy toàn bộ project
cd ..
docker-compose up -d

# 4. Kiểm tra logs
docker-compose logs -f

# 5. Truy cập
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/api/v1/docs
```

## ✅ ĐƯỢC! Project chạy hoàn toàn trên Docker với:

### 📦 Services
- ✅ **PostgreSQL Database** - Port 5432
- ✅ **FastAPI Backend** - Port 8000  
- ✅ **React Frontend** - Port 3000

### 🎯 Features
- ✅ **Auto-migration**: Database tự động setup
- ✅ **Health checks**: Đảm bảo services sống
- ✅ **Hot reload**: Dev mode hỗ trợ auto-reload
- ✅ **Network isolation**: Services communicate qua internal network
- ✅ **Data persistence**: PostgreSQL data được lưu qua volumes

## 🔧 Hai Modes

### 1️⃣ Production Mode (Mặc định)
```bash
docker-compose up -d
```
- Frontend build thành static files
- Tối ưu performance
- Port: 3000

### 2️⃣ Development Mode (Hot Reload)
```bash
docker-compose -f docker-compose.dev.yml up -d
```
- Vite dev server
- Auto-reload khi code thay đổi
- Port: 5173

## 📝 Environment Variables

Tạo `backend/.env`:
```env
# Database
DATABASE_URL=postgresql+psycopg://furniture_user:123456@db:5432/furniture_db

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (cho phép frontend connect)
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173

# App
PROJECT_NAME=Luxe Furniture API
DEBUG=True
ENVIRONMENT=local
```

## 🛑 Stop Services

```bash
# Stop tất cả
docker-compose down

# Stop và xóa volumes (⚠️ mất data)
docker-compose down -v
```

## 🐛 Debug

```bash
# Xem logs realtime
docker-compose logs -f

# Xem logs của service cụ thể
docker-compose logs -f frontend
docker-compose logs -f api
docker-compose logs -f db

# Check status
docker-compose ps

# Restart service
docker-compose restart frontend
```

## 🔄 Rebuild

Khi thay đổi Dockerfile hoặc dependencies:

```bash
# Rebuild tất cả
docker-compose up -d --build

# Rebuild service cụ thể
docker-compose up -d --build frontend
```

## ✨ Kết Quả

Sau khi chạy thành công:

1. **Frontend** sẽ có giao diện sang trọng với:
   - Hero slideshow
   - Product listings
   - Categories
   - Luxury design

2. **Backend** cung cấp:
   - RESTful API
   - Authentication
   - Product management
   - Order processing

3. **Database** tự động:
   - Create tables
   - Run migrations
   - Seed data (nếu có)

## 🎨 Design mới

Frontend đã được redesign hoàn toàn với:
- Luxury color palette (black, gold, bronze)
- Playfair Display + Montserrat fonts
- Professional product cards
- Smooth animations
- Responsive design

Xem chi tiết: `frontend/DESIGN_GUIDE.md`

---

**Vậy là XONG! 🎉** Project chạy hoàn toàn trên Docker, không cần cài đặt gì thêm ngoài Docker Desktop!
