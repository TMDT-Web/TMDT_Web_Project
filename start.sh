#!/bin/bash
# Bash script để chạy Luxe Furniture project với Docker
# Sử dụng: ./start.sh

echo "=================================="
echo "  LUXE FURNITURE - Docker Setup  "
echo "=================================="
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker first."
    exit 1
fi
echo "✓ Docker is running"
echo ""

# Check if .env exists in backend
if [ ! -f "backend/.env" ]; then
    echo "WARNING: backend/.env not found!"
    echo "Creating default .env file..."
    
    cat > backend/.env << 'EOF'
# Database
DATABASE_URL=postgresql+psycopg://furniture_user:123456@db:5432/furniture_db
TEST_DATABASE_URL=postgresql+psycopg://furniture_user:123456@db:5432/furniture_test_db

# JWT Settings
JWT_SECRET_KEY=35-anh-hung-rau-ma
JWT_REFRESH_SECRET_KEY=tieu-vuong-quoc-rau-ma
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=1440

# Application Settings
PROJECT_NAME=Luxe Furniture API
DEBUG=True
ENVIRONMENT=local
API_PREFIX=/api

# CORS Settings
CORS_ALLOW_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Payment Settings
PAYMENT_CALLBACK_BASE_URL=http://localhost:8000/api/payments

# Rewards Settings
REWARD_POINT_RATE=0.05
POINTS_PER_VOUCHER=100
VOUCHER_VALUE=50000
EOF
    
    echo "✓ Created backend/.env"
fi
echo ""

# Ask user which mode to run
echo "Select mode:"
echo "  1. Production (Port 3000) - Optimized build"
echo "  2. Development (Port 5173) - Hot reload"
echo ""
read -p "Enter choice (1 or 2) [default: 1]: " mode

if [ -z "$mode" ]; then
    mode="1"
fi

echo ""
if [ "$mode" = "2" ]; then
    echo "Starting in DEVELOPMENT mode..."
    echo "This may take a few minutes on first run..."
    echo ""
    docker-compose -f docker-compose.dev.yml up -d --build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Services started successfully!"
        echo ""
        echo "Access your application at:"
        echo "  Frontend (Vite):  http://localhost:5173"
        echo "  Backend API:      http://localhost:8000"
        echo "  API Docs:         http://localhost:8000/api/v1/docs"
        echo "  Database:         localhost:5432"
        echo ""
        echo "Hot reload is ENABLED - code changes will auto-refresh!"
    fi
else
    echo "Starting in PRODUCTION mode..."
    echo "Building optimized images (this may take a few minutes)..."
    echo ""
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Services started successfully!"
        echo ""
        echo "Access your application at:"
        echo "  Frontend:         http://localhost:3000"
        echo "  Backend API:      http://localhost:8000"
        echo "  API Docs:         http://localhost:8000/api/v1/docs"
        echo "  Database:         localhost:5432"
    fi
fi

echo ""
echo "Useful commands:"
echo "  View logs:        docker-compose logs -f"
echo "  Stop services:    docker-compose down"
echo "  Restart:          docker-compose restart"
echo ""
echo "Press Ctrl+C to exit or view logs..."

# Show logs
sleep 2
if [ "$mode" = "2" ]; then
    docker-compose -f docker-compose.dev.yml logs -f
else
    docker-compose logs -f
fi
