# ==============================================================================
# Luxe Furniture - Quick Restart with Rebuild
# ==============================================================================
# This script rebuilds and restarts backend and frontend to apply code changes
# Database is preserved - use start.ps1 for full reset
# ==============================================================================

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LUXE FURNITURE - RESTART & REBUILD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check if containers exist
Write-Host "[Step 1/5] Checking container status..." -ForegroundColor Yellow
try {
    $allContainers = docker-compose ps --services 2>$null
    $containerCount = ($allContainers | Measure-Object -Line).Lines
    
    if ($containerCount -eq 0) {
        Write-Host "[WARNING] No containers found" -ForegroundColor Yellow
        Write-Host "  Use .\start.ps1 to start the application from scratch" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "[OK] Found $containerCount container(s)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to check container status: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Stop backend and frontend containers
Write-Host "`n[Step 2/5] Stopping Backend and Frontend services..." -ForegroundColor Yellow
try {
    docker-compose stop backend frontend
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to stop services"
    }
    
    Write-Host "[OK] Services stopped successfully" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to stop services: $_" -ForegroundColor Red
    Write-Host "`nTo debug, run: docker-compose logs -f" -ForegroundColor Yellow
    exit 1
}

# Step 3: Rebuild backend and frontend containers
Write-Host "`n[Step 3/5] Rebuilding Backend and Frontend..." -ForegroundColor Yellow
try {
    Write-Host "  Building backend..." -ForegroundColor Gray
    docker-compose build backend
    
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed"
    }
    
    Write-Host "  Building frontend..." -ForegroundColor Gray
    docker-compose build frontend
    
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
    
    Write-Host "[OK] Services rebuilt successfully" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to rebuild services: $_" -ForegroundColor Red
    Write-Host "`nTo debug, run: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

# Step 4: Start backend and frontend containers
Write-Host "`n[Step 4/5] Starting Backend and Frontend services..." -ForegroundColor Yellow
try {
    docker-compose up -d backend frontend
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to start services"
    }
    
    Write-Host "[OK] Services started successfully" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to start services: $_" -ForegroundColor Red
    Write-Host "`nTo debug, run: docker-compose logs -f" -ForegroundColor Yellow
    exit 1
}

# Step 5: Wait for services to initialize
Write-Host "`n[Step 5/5] Waiting for services to initialize..." -ForegroundColor Yellow
$maxAttempts = 20
$attempt = 0
$servicesReady = $false

while ($attempt -lt $maxAttempts) {
    $attempt++
    Write-Host "  Attempt $attempt/$maxAttempts - Checking service health..." -ForegroundColor Gray
    
    # Check if backend and frontend are running
    $backendStatus = docker-compose ps backend --format json 2>$null | ConvertFrom-Json
    $frontendStatus = docker-compose ps frontend --format json 2>$null | ConvertFrom-Json
    
    if ($backendStatus.State -eq "running" -and $frontendStatus.State -eq "running") {
        Start-Sleep -Seconds 2
        $servicesReady = $true
        Write-Host "[OK] Services are healthy and running" -ForegroundColor Green
        break
    }
    
    if ($attempt -lt $maxAttempts) {
        Start-Sleep -Seconds 2
    }
}

if (-not $servicesReady) {
    Write-Host "[WARNING] Services may not be fully ready yet" -ForegroundColor Yellow
    Write-Host "  Check logs if you encounter issues: docker-compose logs -f" -ForegroundColor Gray
}

# Verify final status
try {
    $services = docker-compose ps --services --filter "status=running"
    $runningServices = ($services | Measure-Object -Line).Lines
    Write-Host "`n[INFO] $runningServices service(s) are running" -ForegroundColor Cyan
}
catch {
    Write-Host "[WARNING] Could not verify service status" -ForegroundColor Yellow
}

# Success message
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  [OK] RESTART & REBUILD COMPLETED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`n[Services Available]" -ForegroundColor Cyan
Write-Host "  - Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  - API Docs:  http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n[What Happened]" -ForegroundColor Cyan
Write-Host "  - Backend and Frontend were rebuilt with latest code" -ForegroundColor Gray
Write-Host "  - Database was preserved (no data loss)" -ForegroundColor Gray
Write-Host "  - All code changes have been applied" -ForegroundColor Gray

Write-Host "`n[Useful Commands]" -ForegroundColor Cyan
Write-Host "  - View logs:       docker-compose logs -f" -ForegroundColor Gray
Write-Host "  - View backend:    docker-compose logs -f backend" -ForegroundColor Gray
Write-Host "  - View frontend:   docker-compose logs -f frontend" -ForegroundColor Gray
Write-Host "  - Stop services:   docker-compose down" -ForegroundColor Gray
Write-Host "  - Full reset:      .\start.ps1" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Green
