# 🛋️ Luxe Furniture E-commerce Platform

> Website thương mại điện tử bán nội thất cao cấp với tích hợp giỏ hàng, thanh toán trực tuyến và chat real-time.

## 🏗️ Tech Stack

### Backend
- **FastAPI** (Python 3.11) - Modern async web framework
- **SQLAlchemy** - ORM for PostgreSQL with pessimistic locking
- **Alembic** - Database migrations
- **Redis** - Caching & Session storage
- **JWT** - Authentication & Authorization
- **WebSocket** - Real-time chat support
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool & Dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Socket.io Client** - Real-time communication

### Database
- **PostgreSQL 15** - Primary database with ACID compliance
- **Redis 7** - Cache & Real-time data

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Web server & reverse proxy

## 📁 Project Structure

```
Luxe_Furniture/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Config, database, security
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts
│   └── tests/              # Test files
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React contexts
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── docker-compose.yml      # Docker orchestration
├── start.ps1              # Full startup script
└── restart.ps1            # Quick restart script
```

## 🚀 Quick Start (Khởi động nhanh)

### Yêu cầu hệ thống (Prerequisites)
- **Docker Desktop** (đã cài đặt và đang chạy)
- **PowerShell** (Windows) hoặc **Bash** (Linux/Mac)
- **Git** (để clone project)

### Cách 1: Sử dụng Scripts Tự động (Khuyến nghị) ⭐

#### 🟢 Khởi chạy lần đầu hoặc Reset hoàn toàn

Script này sẽ:
- Dọn dẹp containers cũ và database
- Build lại images mới nhất
- Khởi động tất cả services
- Chờ database sẵn sàng
- Tạo database schema
- Seed dữ liệu mẫu (admin user + products)

```powershell
# Chạy từ thư mục gốc project
.\start.ps1
```

**Thời gian chạy**: ~30-60 giây lần đầu tiên

**Kết quả mong đợi**:
```
========================================
  ✓ STARTUP COMPLETED SUCCESSFULLY!
========================================

📦 Services Available:
  • Frontend:  http://localhost:3000
  • Backend:   http://localhost:8000
  • API Docs:  http://localhost:8000/docs

👤 Default Admin Credentials:
  • Email:     admin@gmail.com
  • Password:  admin@123
```

#### 🔄 Khởi động lại nhanh (sau khi sửa code)

Script này chỉ restart backend và frontend, **KHÔNG động đến database**:

```powershell
# Dùng khi bạn vừa sửa code và muốn test ngay
.\restart.ps1
```

**Thời gian chạy**: ~5-10 giây

**Khi nào dùng**:
- ✅ Sửa code backend/frontend
- ✅ Cần apply thay đổi nhanh
- ❌ KHÔNG dùng khi thay đổi database schema

### Cách 2: Sử dụng Docker Compose (Manual)

```bash
# Khởi động tất cả services
docker-compose up -d --build

# Xem logs real-time
docker-compose logs -f

# Chạy migrations (nếu cần)
docker-compose exec backend alembic upgrade head

# Seed dữ liệu
docker-compose exec backend python scripts/seed_data.py

# Dừng tất cả services
docker-compose down

# Dừng và xóa volumes (reset database)
docker-compose down -v
```

## 🌐 Truy cập ứng dụng

Sau khi chạy `.\start.ps1` thành công, truy cập:

| Service | URL | Mô tả |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Trang web chính |
| **Backend API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Swagger UI Documentation |
| **ReDoc** | http://localhost:8000/redoc | Alternative API docs |
| **Database** | localhost:5432 | PostgreSQL (user: postgres, pass: postgres) |
| **Redis** | localhost:6379 | Cache server |

## 🔐 Tài khoản mặc định

### Admin Account (Quản trị viên)
```
Email:    admin@gmail.com
Password: admin@123
Role:     ADMIN
VIP Tier: DIAMOND
```

### Dữ liệu mẫu
- ✅ 4 Categories: Sofa, Bed, Dining Table, Wardrobe
- ✅ 4 Products với ảnh từ Unsplash
- ✅ Tất cả products có stock và pricing đầy đủ

## 🛠️ Development Setup (Phát triển local)

### Backend Development

```bash
cd backend

# Tạo virtual environment
python -m venv venv

# Kích hoạt virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
venv\Scripts\activate.bat
# Linux/Mac:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Sửa file .env với config của bạn

# Chạy migrations
alembic upgrade head

# Seed dữ liệu
python scripts/seed_data.py

# Chạy development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Cài đặt dependencies
npm install

# Setup environment variables
cp .env.example .env
# Sửa file .env với config của bạn

# Chạy development server
npm run dev

# Build cho production
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Chạy tất cả tests
pytest

# Chạy với coverage report
pytest --cov=app tests/

# Chạy specific test file
pytest tests/test_products.py

# Chạy với verbose output
pytest -v
```

### Frontend Tests

```bash
cd frontend

# Chạy tests
npm run test

# Chạy với coverage
npm run test:coverage
```

## 📦 Database Migrations

```bash
cd backend

# Tạo migration mới (auto-generate từ models)
alembic revision --autogenerate -m "add_likes_column_to_products"

# Apply tất cả migrations
alembic upgrade head

# Rollback 1 migration
alembic downgrade -1

# Xem history
alembic history

# Xem current version
alembic current
```

## 🎨 Core Features

### 🛍️ Customer Features
- ✅ Duyệt sản phẩm với filters & search
- ✅ Chi tiết sản phẩm với gallery ảnh
- ✅ Quản lý giỏ hàng (thêm/sửa/xóa)
- ✅ Checkout với nhiều phương thức thanh toán
- ✅ Theo dõi đơn hàng
- ✅ Chat support real-time
- ✅ User profile & lịch sử đơn hàng
- ✅ Địa chỉ giao hàng (nhiều địa chỉ)
- ✅ VIP tiers & loyalty points

### 👨‍💼 Admin Features
- ✅ Dashboard với analytics
- ✅ Quản lý sản phẩm (CRUD)
- ✅ Quản lý categories & collections
- ✅ Quản lý đơn hàng (cập nhật status)
- ✅ Quản lý users & phân quyền
- ✅ Chat support interface
- ✅ Upload & quản lý hình ảnh
- ✅ Banner management

### 💳 Payment Methods
- ✅ COD (Cash on Delivery)
- 🔄 MoMo E-Wallet (Coming soon)
- 🔄 VNPAY Gateway (Coming soon)

### 🔒 Security Features
- ✅ JWT Authentication với refresh tokens
- ✅ Role-based access control (CUSTOMER/STAFF/ADMIN)
- ✅ Password hashing với bcrypt
- ✅ CORS configuration
- ✅ Input validation với Pydantic
- ✅ SQL injection prevention
- ✅ XSS protection

### ⚡ Performance Features
- ✅ Pessimistic locking cho race conditions
- ✅ Database indexing
- ✅ Redis caching
- ✅ Pagination cho large datasets
- ✅ Lazy loading images
- ✅ Connection pooling

## 📝 API Documentation

Sau khi start backend, truy cập:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main API Endpoints

```
Authentication:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

Products:
GET    /api/v1/products              # List với filters
GET    /api/v1/products/{id}         # Detail
POST   /api/v1/products              # Create (Admin)
PUT    /api/v1/products/{id}         # Update (Admin)
DELETE /api/v1/products/{id}         # Delete (Admin)

Categories:
GET    /api/v1/products/categories/
POST   /api/v1/products/categories/  # Create (Admin)
PUT    /api/v1/products/categories/{id}  # Update (Admin)
DELETE /api/v1/products/categories/{id}  # Delete (Admin)

Collections:
GET    /api/v1/collections
POST   /api/v1/collections           # Create (Admin)
PUT    /api/v1/collections/{id}      # Update (Admin)
DELETE /api/v1/collections/{id}      # Delete (Admin)

Cart:
GET    /api/v1/cart
POST   /api/v1/cart/items
PUT    /api/v1/cart/items/{id}
DELETE /api/v1/cart/items/{id}

Orders:
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/{id}
PUT    /api/v1/orders/{id}           # Update status (Admin)
```

## 🐛 Troubleshooting

### Lỗi thường gặp

**1. "Port 3000 already in use"**
```powershell
# Tìm và kill process đang dùng port
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**2. "Cannot connect to Docker daemon"**
- ✅ Kiểm tra Docker Desktop đã chạy chưa
- ✅ Restart Docker Desktop

**3. "Database migration failed"**
```powershell
# Reset database hoàn toàn
docker-compose down -v
.\start.ps1
```

**4. "Backend không start được"**
```powershell
# Xem logs để debug
docker-compose logs backend

# Kiểm tra database connection
docker-compose exec backend python -c "from app.core.database import engine; print('DB OK')"
```

## 🤝 Contributing (Đóng góp)

### Quy trình làm việc

1. **Fork repository**
2. **Clone về máy**
   ```bash
   git clone https://github.com/TMDT-Web/TMDT_Web_Project.git
   cd TMDT_Web_Project
   ```

3. **Tạo branch mới**
   ```bash
   git checkout -b feature/ten-tinh-nang
   ```

4. **Code và test**
   ```bash
   # Chạy tests
   pytest
   npm run test
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: thêm tính năng xyz"
   ```

6. **Push và tạo Pull Request**
   ```bash
   git push origin feature/ten-tinh-nang
   ```

### Commit Message Convention

```
feat: Thêm tính năng mới
fix: Sửa bug
docs: Cập nhật documentation
style: Format code, thêm comments
refactor: Refactor code
test: Thêm tests
chore: Update dependencies, configs
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- [Docker Documentation](https://docs.docker.com/)

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Developer**: Hoangson Le
- **Project Type**: E-commerce Platform
- **Course**: Web Development (TMDT)

## 📧 Contact & Support

- **GitHub**: https://github.com/TMDT-Web/TMDT_Web_Project
- **Issues**: https://github.com/TMDT-Web/TMDT_Web_Project/issues

## 🙏 Acknowledgments

- FastAPI team for the amazing framework
- React team for the powerful UI library
- All open-source contributors

---

Made with ❤️ by Luxe Furniture Team | © 2025
