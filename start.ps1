# ==============================================================================
# Luxe Furniture - Full Startup Script (From Scratch)
# ==============================================================================
# This script performs a complete clean start with database migration and seeding
# ==============================================================================

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LUXE FURNITURE - FULL STARTUP" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Clean up old containers and volumes (complete reset)
Write-Host "[Step 1/6] Cleaning up old containers and database..." -ForegroundColor Yellow
try {
    # Stop and remove containers, networks, and volumes for a complete clean start
    docker-compose down -v
    
    # Force remove volumes manually (docker-compose down -v sometimes doesn't work)
    Write-Host "  Force removing volumes..." -ForegroundColor Gray
    docker volume rm luxe_furniture_postgres_data -f 2>$null
    docker volume rm luxe_furniture_backend_static -f 2>$null
    
    Write-Host "✓ Old containers and volumes removed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to remove old containers: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Build and start containers
Write-Host "`n[Step 2/6] Building and starting containers..." -ForegroundColor Yellow
try {
    docker-compose up -d --build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Build failed, cleaning cache and retrying..." -ForegroundColor Yellow
        docker system prune -f | Out-Null
        docker-compose build --no-cache
        docker-compose up -d
        
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed after cache cleanup"
        }
    }
    
    Write-Host "✓ Containers built and started successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to start containers: $_" -ForegroundColor Red
    Write-Host "  Try manually: docker system prune -f && docker-compose build --no-cache" -ForegroundColor Yellow
    exit 1
}

# Step 3: Health check - Wait for PostgreSQL to be ready
Write-Host "`n[Step 3/6] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$dbReady = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "  Attempt $attempt/$maxAttempts - Checking database status..." -ForegroundColor Gray
    
    # Check if PostgreSQL is accepting connections
    $result = docker-compose exec -T db pg_isready -U postgres 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        # Additional check: ensure backend can connect
        Start-Sleep -Seconds 2
        $dbReady = $true
        Write-Host "✓ PostgreSQL is ready and accepting connections!" -ForegroundColor Green
        break
    }
    
    if ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 2
    }
}

if (-not $dbReady) {
    Write-Host "✗ PostgreSQL failed to start within timeout period" -ForegroundColor Red
    Write-Host "  Please check docker logs: docker-compose logs db" -ForegroundColor Yellow
    exit 1
}

# Step 4: Initialize database schema
Write-Host "`n[Step 4/6] Initializing database schema..." -ForegroundColor Yellow
try {
    # Wait a bit more to ensure backend is fully initialized
    Start-Sleep -Seconds 3
    
    # Use alembic stamp to mark the database as up-to-date without running migrations
    # This is useful when models already match the current schema
    Write-Host "  Creating database schema from models..." -ForegroundColor Gray
    
    # Create all tables directly from models
    $initResult = docker-compose exec -T backend python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine); print('Tables created')" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database schema created from models" -ForegroundColor Green
        
        # Stamp the alembic version to the latest
        Write-Host "  Marking migrations as applied..." -ForegroundColor Gray
        $stampResult = docker-compose exec -T backend alembic stamp head 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database migrations marked as applied" -ForegroundColor Green
        } else {
            Write-Host "⚠ Warning: Could not stamp alembic version" -ForegroundColor Yellow
        }
    } else {
        throw "Failed to create database schema"
    }
    
} catch {
    Write-Host "✗ Database initialization failed: $_" -ForegroundColor Red
    Write-Host "`nInitialization output:" -ForegroundColor Yellow
    Write-Host $initResult -ForegroundColor Gray
    Write-Host "`nTo debug, run: docker-compose logs backend" -ForegroundColor Yellow
    exit 1
}

# Step 5: Seed database with initial data
Write-Host "`n[Step 5/6] Seeding database with initial data..." -ForegroundColor Yellow
try {
    $seedResult = docker-compose exec -T backend python scripts/seed_data.py 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Seed command failed with exit code $LASTEXITCODE"
    }
    
    Write-Host "✓ Database seeded successfully" -ForegroundColor Green
    Write-Host "`nSeed output:" -ForegroundColor Cyan
    Write-Host $seedResult -ForegroundColor Gray
} catch {
    Write-Host "✗ Database seeding failed: $_" -ForegroundColor Red
    Write-Host "`nSeed output:" -ForegroundColor Yellow
    Write-Host $seedResult -ForegroundColor Gray
    Write-Host "`nTo debug, run: docker-compose logs backend" -ForegroundColor Yellow
    exit 1
}

# Step 6: Final status check
Write-Host "`n[Step 6/6] Verifying all services..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$services = docker-compose ps --services --filter "status=running"
$runningServices = ($services | Measure-Object -Line).Lines

if ($runningServices -ge 3) {
    Write-Host "✓ All services are running" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: Some services may not be running properly" -ForegroundColor Yellow
    docker-compose ps
}

# Success message
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✓ STARTUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n📦 Services Available:" -ForegroundColor Cyan
Write-Host "  • Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  • Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  • API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  • Database:  localhost:5432" -ForegroundColor White

Write-Host "`n👤 Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "  • Email:     admin@gmail.com" -ForegroundColor White
Write-Host "  • Password:  admin@123" -ForegroundColor White

Write-Host "`n💡 Useful Commands:" -ForegroundColor Cyan
Write-Host "  • View logs:      docker-compose logs -f" -ForegroundColor Gray
Write-Host "  • Stop services:  docker-compose down" -ForegroundColor Gray
Write-Host "  • Quick restart:  .\restart.ps1" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Green
