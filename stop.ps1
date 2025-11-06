# PowerShell script để stop services
# Sử dụng: .\stop.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Stopping LUXE FURNITURE...     " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to remove volumes
Write-Host "Do you want to remove database volumes?" -ForegroundColor Yellow
Write-Host "  WARNING: This will delete all data!" -ForegroundColor Red
Write-Host ""
$removeVolumes = Read-Host "Remove volumes? (y/N) [default: N]"

Write-Host ""
if ($removeVolumes -eq "y" -or $removeVolumes -eq "Y") {
    Write-Host "Stopping services and removing volumes..." -ForegroundColor Yellow
    docker-compose down -v
    docker-compose -f docker-compose.dev.yml down -v
} else {
    Write-Host "Stopping services (keeping data)..." -ForegroundColor Yellow
    docker-compose down
    docker-compose -f docker-compose.dev.yml down
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ All services stopped successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "⚠ Some errors occurred" -ForegroundColor Yellow
}
