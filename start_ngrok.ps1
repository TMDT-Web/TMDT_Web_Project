#!/usr/bin/env pwsh
# Script to start ngrok and update environment files with the new URL

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Ngrok for QR Payment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Kill existing ngrok processes
Write-Host "`n[1/5] Stopping existing ngrok processes..." -ForegroundColor Yellow
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Step 2: Start ngrok for frontend (port 3000)
Write-Host "[2/5] Starting ngrok tunnel for port 3000..." -ForegroundColor Yellow
$ngrokPath = if (Test-Path ".\ngrok.exe") { ".\ngrok.exe" } else { "ngrok" }
Start-Process -FilePath $ngrokPath -ArgumentList "http", "3000", "--log=ngrok.log" -WindowStyle Minimized

# Step 3: Wait for ngrok to initialize
Write-Host "[3/5] Waiting for ngrok to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Step 4: Get the ngrok URL
Write-Host "[4/5] Retrieving ngrok URL..." -ForegroundColor Yellow
$maxRetries = 5
$retryCount = 0
$ngrokUrl = $null

while ($retryCount -lt $maxRetries -and -not $ngrokUrl) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $ngrokUrl = $response.tunnels | Where-Object { $_.config.addr -like '*3000*' } | Select-Object -ExpandProperty public_url -First 1
        
        if ($ngrokUrl) {
            Write-Host "✓ Ngrok URL: $ngrokUrl" -ForegroundColor Green
        } else {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Host "  Retrying... ($retryCount/$maxRetries)" -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "  Retrying... ($retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
}

if (-not $ngrokUrl) {
    Write-Host "✗ Failed to get ngrok URL!" -ForegroundColor Red
    Write-Host "Please check if ngrok is running properly." -ForegroundColor Red
    exit 1
}

# Step 5: Update environment files
Write-Host "[5/5] Updating environment files..." -ForegroundColor Yellow

# Update root .env (for docker-compose)
$rootEnvPath = ".env"
if (Test-Path $rootEnvPath) {
    $rootEnvContent = Get-Content $rootEnvPath | Where-Object { $_ -notmatch '^FRONTEND_BASE_URL=' }
    $rootEnvContent += "FRONTEND_BASE_URL=$ngrokUrl"
    $rootEnvContent | Set-Content $rootEnvPath
    Write-Host "✓ Updated $rootEnvPath" -ForegroundColor Green
} else {
    "FRONTEND_BASE_URL=$ngrokUrl" | Set-Content $rootEnvPath
    Write-Host "✓ Created $rootEnvPath" -ForegroundColor Green
}

# Update backend/.env
$backendEnvPath = "backend/.env"
if (Test-Path $backendEnvPath) {
    $backendEnvContent = Get-Content $backendEnvPath | Where-Object { $_ -notmatch '^FRONTEND_BASE_URL=' }
    $backendEnvContent += "FRONTEND_BASE_URL=$ngrokUrl"
    $backendEnvContent | Set-Content $backendEnvPath
    Write-Host "✓ Updated $backendEnvPath" -ForegroundColor Green
}

# Update frontend/.env
$frontendEnvPath = "frontend/.env"
if (Test-Path $frontendEnvPath) {
    $frontendEnvContent = Get-Content $frontendEnvPath | Where-Object { $_ -notmatch '^VITE_NGROK_URL=' }
    $frontendEnvContent += "VITE_NGROK_URL=$ngrokUrl"
    $frontendEnvContent | Set-Content $frontendEnvPath
    Write-Host "✓ Updated $frontendEnvPath" -ForegroundColor Green
}

# Restart backend to load new environment variable
Write-Host "`nRestarting backend container..." -ForegroundColor Yellow
docker-compose rm -sf backend | Out-Null
docker-compose up -d backend | Out-Null
Start-Sleep -Seconds 2

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Ngrok Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNgrok URL: $ngrokUrl" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Open: $ngrokUrl" -ForegroundColor White
Write-Host "2. Click 'Visit Site' on the ngrok warning page" -ForegroundColor White
Write-Host "3. Login with admin@gmail.com / admin@123" -ForegroundColor White
Write-Host "4. Add products to cart and checkout with QR payment" -ForegroundColor White
Write-Host "5. Scan the QR code with your mobile phone" -ForegroundColor White
Write-Host "`nTo stop ngrok: Get-Process ngrok | Stop-Process -Force" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Green
