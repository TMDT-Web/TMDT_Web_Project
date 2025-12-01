# Start dual ngrok tunnels for frontend and backend
Write-Host "=== STARTING NGROK TUNNELS ===" -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
try {
    $ngrokVersion = ngrok version
    Write-Host "✓ Ngrok found: $ngrokVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Ngrok not found! Please install:" -ForegroundColor Red
    Write-Host "  Download: https://ngrok.com/download" -ForegroundColor Yellow
    Write-Host "  Or: choco install ngrok" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting 2 ngrok tunnels..." -ForegroundColor Yellow
Write-Host ""

# Start frontend tunnel (port 3000) in background
$frontend = Start-Process -FilePath "ngrok" -ArgumentList "http 3000 --log=stdout" -NoNewWindow -PassThru -RedirectStandardOutput "ngrok_frontend.log"
Write-Host "✓ Frontend tunnel started (port 3000)" -ForegroundColor Green

# Start backend tunnel (port 8000) in background  
$backend = Start-Process -FilePath "ngrok" -ArgumentList "http 8000 --log=stdout" -NoNewWindow -PassThru -RedirectStandardOutput "ngrok_backend.log"
Write-Host "✓ Backend tunnel started (port 8000)" -ForegroundColor Green

Write-Host ""
Write-Host "Waiting for ngrok to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== NGROK URLS ===" -ForegroundColor Cyan

# Get URLs from ngrok API
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    
    foreach ($tunnel in $tunnels.tunnels) {
        $port = $tunnel.config.addr -replace '.*:(\d+).*', '$1'
        $url = $tunnel.public_url
        
        if ($port -eq "3000") {
            Write-Host "Frontend (3000): $url" -ForegroundColor Green
            $env:FRONTEND_NGROK = $url
        } elseif ($port -eq "8000") {
            Write-Host "Backend (8000):  $url" -ForegroundColor Green
            $env:BACKEND_NGROK = $url
        }
    }
    
    Write-Host ""
    Write-Host "Now run: .\set_ngrok_url.ps1" -ForegroundColor Yellow
    Write-Host "  Frontend URL: $env:FRONTEND_NGROK" -ForegroundColor Gray
    Write-Host "  Backend URL:  $env:BACKEND_NGROK" -ForegroundColor Gray
    
} catch {
    Write-Host "[ERROR] Could not get ngrok URLs" -ForegroundColor Red
    Write-Host "Check manually at: http://localhost:4040" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press Ctrl+C to stop ngrok tunnels" -ForegroundColor Yellow
Write-Host "Logs: ngrok_frontend.log, ngrok_backend.log" -ForegroundColor Gray

# Keep script running
Wait-Process -Id $frontend.Id, $backend.Id
