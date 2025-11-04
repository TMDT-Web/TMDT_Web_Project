# 🪑 LUXE FURNITURE - Premium E-Commerce Platform

> Nền tảng thương mại điện tử cao cấp cho nội thất sang trọng

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)
[![React Router](https://img.shields.io/badge/React%20Router-v7-orange)](https://reactrouter.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

## ✨ Tính Năng Chính

### 🎨 Frontend - Luxury Design
- ✅ **Thiết kế sang trọng** với Playfair Display & Montserrat fonts
- ✅ **Color palette** cao cấp (Black, Gold, Bronze)
- ✅ **Responsive design** - Mobile, Tablet, Desktop
- ✅ **Smooth animations** - Hero slideshow, hover effects
- ✅ **Modern components** - Product cards, filters, pagination

### 🚀 Backend - Powerful API
- ✅ **FastAPI** - High performance async API
- ✅ **PostgreSQL** - Robust database
- ✅ **JWT Authentication** - Secure login system
- ✅ **Product Management** - CRUD operations
- ✅ **Order Processing** - Complete checkout flow
- ✅ **Payment Integration** - Ready for payment gateways
- ✅ **Rewards System** - Points & vouchers

### 🐳 DevOps
- ✅ **Docker Compose** - One-command deployment
- ✅ **Multi-stage builds** - Optimized images
- ✅ **Health checks** - Service monitoring
- ✅ **Hot reload** - Development mode
- ✅ **Data persistence** - Volume management

## 🚀 Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Git (optional)

### 🪟 Windows

```powershell
# Clone repository
git clone <repo-url>
cd TMDT_Web_Project

# Start services
.\start.ps1
```

### 🐧 Linux / Mac

```bash
# Clone repository
git clone <repo-url>
cd TMDT_Web_Project

# Make scripts executable
chmod +x start.sh stop.sh

# Start services
./start.sh
```

### 🌐 Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/v1/docs
- **Database**: localhost:5432

## 📁 Project Structure

```
TMDT_Web_Project/
├── 📂 frontend/                 # React Router v7 Application
│   ├── app/
│   │   ├── components/         # Navbar, Footer, Layout
│   │   ├── routes/            # Pages (Home, Products, About, Contact)
│   │   ├── lib/               # API calls, utilities
│   │   └── app.css            # Luxury design system
│   ├── Dockerfile             # Production build
│   ├── Dockerfile.dev         # Development mode
│   └── DESIGN_GUIDE.md        # Design documentation
│
├── 📂 backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/              # Config, database, security
│   │   ├── users/             # User management
│   │   ├── products/          # Product CRUD
│   │   ├── orders/            # Order processing
│   │   ├── cart/              # Shopping cart
│   │   ├── payments/          # Payment integration
│   │   └── rewards/           # Loyalty program
│   ├── alembic/               # Database migrations
│   ├── tests/                 # Unit & integration tests
│   └── Dockerfile             # Backend container
│
├── 📂 docker-compose.yml        # Production deployment
├── 📂 docker-compose.dev.yml   # Development with hot-reload
├── 📜 start.ps1 / start.sh     # Quick start scripts
├── 📜 stop.ps1 / stop.sh       # Stop scripts
├── 📖 QUICKSTART.md            # Quick reference
└── 📖 DOCKER_SETUP.md          # Detailed Docker guide
```

## 🎨 Design Highlights

### Color Palette
- **Primary**: `#1A1A1A` (Rich Black)
- **Secondary**: `#8B7355` (Warm Bronze)
- **Accent**: `#D4AF37` (Elegant Gold)
- **Background**: `#FAF8F6` (Warm White)

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Montserrat (sans-serif)

### Key Pages
1. **Home** - Hero slideshow, categories, featured products
2. **Products** - Grid with filters, pagination
3. **Collections** - Curated product collections
4. **About** - Company story and values
5. **Contact** - Contact form and information

## 🛠️ Development

### Start Development Mode

```bash
# Windows
.\start.ps1
# Select option 2 (Development)

# Linux/Mac
./start.sh
# Select option 2 (Development)
```

**Features:**
- Hot reload for both frontend & backend
- Vite dev server on port 5173
- Source code mounted in containers
- Fast development cycle

### Run Tests

```bash
# Backend tests
docker-compose exec api pytest

# With coverage
docker-compose exec api pytest --cov=app
```

### Database Migrations

```bash
# Create new migration
docker-compose exec api alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec api alembic upgrade head

# Rollback
docker-compose exec api alembic downgrade -1
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql+psycopg://furniture_user:123456@db:5432/furniture_db

# JWT
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173

# App
PROJECT_NAME=Luxe Furniture API
DEBUG=True
```

### Frontend Environment

Create `frontend/.env` (optional):

```env
VITE_API_URL=http://localhost:8000
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/{id}` - Get product detail
- `POST /api/v1/products` - Create product (admin)
- `PUT /api/v1/products/{id}` - Update product (admin)
- `DELETE /api/v1/products/{id}` - Delete product (admin)

### Cart & Orders
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart/items` - Add to cart
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - List user orders

Full API documentation: http://localhost:8000/api/v1/docs

## 🎯 Tech Stack

### Frontend
- **Framework**: React Router v7
- **Styling**: Tailwind CSS 4
- **Build**: Vite
- **HTTP Client**: Fetch API
- **Notifications**: React Toastify

### Backend
- **Framework**: FastAPI
- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Auth**: JWT (python-jose)
- **Validation**: Pydantic v2

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: (Add Nginx if needed)

## 📝 Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart frontend
docker-compose restart api

# Rebuild images
docker-compose up -d --build

# Access container shell
docker-compose exec frontend sh
docker-compose exec api bash

# Database access
docker exec -it furniture_db psql -U furniture_user -d furniture_db
```

## 🐛 Troubleshooting

### Port already in use
Change ports in `docker-compose.yml`

### Database connection failed
Wait for health check: `docker-compose logs db`

### Frontend not loading
Check API CORS settings and rebuild: `docker-compose up -d --build frontend`

### Hot reload not working
Ensure volumes are mounted: `docker-compose -f docker-compose.dev.yml up -d --force-recreate`

## 📚 Documentation

- [Quick Start Guide](QUICKSTART.md)
- [Docker Setup Guide](DOCKER_SETUP.md)
- [Frontend Design Guide](frontend/DESIGN_GUIDE.md)
- [Backend API Guide](backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Frontend**: Luxury e-commerce interface
- **Backend**: RESTful API with FastAPI
- **Database**: PostgreSQL schema design
- **DevOps**: Docker containerization

## 🙏 Acknowledgments

- Design inspiration from luxury furniture brands
- Unsplash for placeholder images
- FastAPI and React Router communities

---

**Made with ❤️ for luxury furniture shopping experience**

🌟 Star this repo if you find it helpful!
