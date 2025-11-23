# ==============================================================================
# Luxe Furniture - Quick Restart Script
# ==============================================================================
# This script quickly restarts backend and frontend without touching the database
# Use this when you've made code changes and want to apply them quickly
# ==============================================================================

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LUXE FURNITURE - QUICK RESTART" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🔄 Restarting Backend and Frontend services..." -ForegroundColor Yellow

try {
    # Restart backend and frontend containers
    docker-compose restart backend frontend
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ Services restarted successfully!" -ForegroundColor Green
        
        # Wait a moment for services to initialize
        Write-Host "`n⏳ Waiting for services to initialize..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
        
        # Success message
        Write-Host "`n========================================" -ForegroundColor Green
        Write-Host "  ✓ RESTART COMPLETED!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        
        Write-Host "`n📦 Services Available:" -ForegroundColor Cyan
        Write-Host "  • Frontend:  http://localhost:3000" -ForegroundColor White
        Write-Host "  • Backend:   http://localhost:8000" -ForegroundColor White
        Write-Host "  • API Docs:  http://localhost:8000/docs" -ForegroundColor White
        
        Write-Host "`n💡 Note: Database was not affected" -ForegroundColor Gray
        Write-Host "   If you need to reset DB, run: .\start.ps1" -ForegroundColor Gray
        
        Write-Host "`n========================================`n" -ForegroundColor Green
    } else {
        throw "Docker restart command failed"
    }
} catch {
    Write-Host "`n✗ Failed to restart services: $_" -ForegroundColor Red
    Write-Host "`nTo debug, run: docker-compose logs -f" -ForegroundColor Yellow
    exit 1
}
