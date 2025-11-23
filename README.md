# 🛋️ LuxeFurniture Reborn

> Website Thương mại điện tử bán nội thất cao cấp với tích hợp giỏ hàng, thanh toán trực tuyến và chat real-time.

## 🏗️ Tech Stack

### Backend
- **FastAPI** (Python 3.11) - Modern async web framework
- **SQLAlchemy** - ORM for PostgreSQL
- **Alembic** - Database migrations
- **Redis** - Caching & Session storage
- **JWT** - Authentication & Authorization
- **WebSocket** - Real-time chat support

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool & Dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client

### Database
- **PostgreSQL 15** - Primary database
- **Redis 7** - Cache & Real-time data

### DevOps
- **Docker & Docker Compose** - Containerization
- **Nginx** - Web server (Production)

## 📁 Project Structure

```
LuxeFurniture_Reborn/
├── backend/          # FastAPI application
├── frontend/         # React + Vite application
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.13+
- Node.js 18+
- PostgreSQL 15 (if running locally)

### 1. Clone & Setup

```bash
cd LuxeFurniture_Reborn
```

### 2. Start with Docker Compose

```bash
# Start all services (DB, Redis, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 3. Access Applications

- **Frontend (Shop)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## 🛠️ Development Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
pytest --cov=app tests/  # With coverage
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📦 Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## 🔐 Default Credentials

### Admin Account
- **Email**: admin@luxefurniture.com
- **Password**: Admin@123456

### Test Customer
- **Email**: customer@test.com
- **Password**: Customer@123

## 🎨 Features

### Customer Features
- ✅ Browse products with filters & search
- ✅ Product detail with image gallery
- ✅ Shopping cart management
- ✅ Checkout with multiple payment methods
- ✅ Order tracking
- ✅ Real-time chat support
- ✅ User profile & order history

### Admin Features
- ✅ Dashboard with analytics
- ✅ Product management (CRUD)
- ✅ Order management
- ✅ User management
- ✅ Chat support interface
- ✅ Image upload & management

### Payment Integration
- 🔄 MoMo E-Wallet
- 🔄 VNPAY Gateway
- ✅ COD (Cash on Delivery)

## 📝 API Documentation

After starting the backend, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Developer**: Your Name
- **Designer**: Designer Name
- **Project Manager**: PM Name

## 📧 Contact

- Email: support@luxefurniture.com
- Website: https://luxefurniture.com
- GitHub: https://github.com/yourusername/LuxeFurniture_Reborn

---

Made with ❤️ by LuxeFurniture Team
