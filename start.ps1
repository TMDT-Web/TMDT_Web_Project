# PowerShell script để chạy Luxe Furniture project với Docker
# Sử dụng: .\start.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  LUXE FURNITURE - Docker Setup  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>$null
if (-not $dockerRunning) {
    Write-Host "ERROR: Docker is not running!" -ForegroundColor Red
    Write-Host "Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker is running" -ForegroundColor Green
Write-Host ""

# Check if .env exists in backend
if (-not (Test-Path "backend\.env")) {
    Write-Host "WARNING: backend\.env not found!" -ForegroundColor Yellow
    Write-Host "Creating default .env file..." -ForegroundColor Yellow
    
    @"
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
"@ | Out-File -FilePath "backend\.env" -Encoding utf8
    
    Write-Host "✓ Created backend\.env" -ForegroundColor Green
}
Write-Host ""

# Ask user which mode to run
Write-Host "Select mode:" -ForegroundColor Cyan
Write-Host "  1. Production (Port 3000) - Optimized build" -ForegroundColor White
Write-Host "  2. Development (Port 5173) - Hot reload" -ForegroundColor White
Write-Host ""
$mode = Read-Host "Enter choice (1 or 2) [default: 1]"

if ([string]::IsNullOrWhiteSpace($mode)) {
    $mode = "1"
}

Write-Host ""
if ($mode -eq "2") {
    Write-Host "Starting in DEVELOPMENT mode..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
    Write-Host ""
    docker-compose -f docker-compose.dev.yml up -d --build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Services started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your application at:" -ForegroundColor Cyan
        Write-Host "  Frontend (Vite):  http://localhost:5173" -ForegroundColor White
        Write-Host "  Backend API:      http://localhost:8000" -ForegroundColor White
        Write-Host "  API Docs:         http://localhost:8000/api/v1/docs" -ForegroundColor White
        Write-Host "  Database:         localhost:5432" -ForegroundColor White
        Write-Host ""
        Write-Host "Hot reload is ENABLED - code changes will auto-refresh!" -ForegroundColor Green
    }
} else {
    Write-Host "Starting in PRODUCTION mode..." -ForegroundColor Yellow
    Write-Host "Building optimized images (this may take a few minutes)..." -ForegroundColor Yellow
    Write-Host ""
    docker-compose up -d --build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Services started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your application at:" -ForegroundColor Cyan
        Write-Host "  Frontend:         http://localhost:3000" -ForegroundColor White
        Write-Host "  Backend API:      http://localhost:8000" -ForegroundColor White
        Write-Host "  API Docs:         http://localhost:8000/api/v1/docs" -ForegroundColor White
        Write-Host "  Database:         localhost:5432" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:        docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop services:    docker-compose down" -ForegroundColor White
Write-Host "  Restart:          docker-compose restart" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to view logs or close this window" -ForegroundColor Yellow

# Show logs
Start-Sleep -Seconds 2
if ($mode -eq "2") {
    docker-compose -f docker-compose.dev.yml logs -f
} else {
    docker-compose logs -f
}
