# Quick Setup Ngrok Script
Write-Host "=== QUICK NGROK SETUP ===" -ForegroundColor Cyan

$ngrokUrl = Read-Host "`nNhập ngrok URL (VD: https://abcd1234.ngrok-free.app)"

if (-not $ngrokUrl) {
  Write-Host "[ERROR] Bạn chưa nhập ngrok URL!" -ForegroundColor Red
  Write-Host ""
  Write-Host "Hướng dẫn:" -ForegroundColor Yellow
  Write-Host "1. Mở terminal mới, chạy: ngrok http 3000" -ForegroundColor White
  Write-Host "2. Copy 'Forwarding' URL (VD: https://abcd-1234.ngrok-free.app)" -ForegroundColor White
  Write-Host "3. Chạy lại script này và paste URL" -ForegroundColor White
  exit 1
}

# Clean URL (remove trailing slash)
$ngrokUrl = $ngrokUrl.TrimEnd('/')

# Validate URL format
if ($ngrokUrl -notmatch '^https://') {
  Write-Host "[WARNING] URL nên bắt đầu bằng https://" -ForegroundColor Yellow
  $continue = Read-Host "Tiếp tục? (y/n)"
  if ($continue -ne 'y') {
    exit 1
  }
}

Write-Host ""
Write-Host "[1/5] Creating/Updating .env files..." -ForegroundColor Yellow

# Update backend .env
$backendEnvContent = @()
if (Test-Path .env) {
  $backendEnvContent = Get-Content .env | Where-Object { $_ -notmatch '^FRONTEND_BASE_URL=' }
}
$backendEnvContent += "FRONTEND_BASE_URL=$ngrokUrl"
$backendEnvContent | Set-Content .env -Encoding UTF8
Write-Host "✓ Backend .env updated with FRONTEND_BASE_URL=$ngrokUrl" -ForegroundColor Green

# Ask if user wants to setup backend ngrok too
Write-Host ""
$setupBackendNgrok = Read-Host "Bạn có ngrok cho backend (port 8000) không? (y/n) [n]"
if ($setupBackendNgrok -eq 'y') {
  $backendNgrokUrl = Read-Host "Nhập ngrok URL cho BACKEND [VD: https://xyz.ngrok-free.dev]"
  if (-not $backendNgrokUrl) {
    $backendNgrokUrl = "http://localhost:8000"
  }
} else {
  # Use localhost:8000 - only works when accessing frontend from same machine
  $backendNgrokUrl = "http://localhost:8000"
  Write-Host "→ Frontend sẽ dùng localhost:8000 (chỉ work khi test trên cùng máy)" -ForegroundColor Yellow
}

$frontendEnvContent = @()
if (Test-Path frontend/.env) {
  $frontendEnvContent = Get-Content frontend/.env | Where-Object { $_ -notmatch '^VITE_API_URL=' }
}
$frontendEnvContent += "VITE_API_URL=$backendNgrokUrl"
$frontendEnvContent | Set-Content frontend/.env -Encoding UTF8
Write-Host "✓ Frontend .env updated with VITE_API_URL=$backendNgrokUrl" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Stopping services..." -ForegroundColor Yellow
docker-compose stop backend
docker-compose stop frontend

Write-Host ""
Write-Host "[3/5] Starting services with new environment..." -ForegroundColor Yellow
docker-compose up -d backend
docker-compose up -d frontend

Write-Host ""
Write-Host "[4/5] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$maxRetries = 10
$retryCount = 0
$backendReady = $false

while ($retryCount -lt $maxRetries -and -not $backendReady) {
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Method GET -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
      $backendReady = $true
      Write-Host "Backend is UP!" -ForegroundColor Green
    }
  } catch {
    $retryCount++
    Write-Host "Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
  }
}

if (-not $backendReady) {
  Write-Host "Backend might still be starting... Check logs with: docker-compose logs backend" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[5/5] Checking frontend..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
try {
  $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3 -ErrorAction Stop
  Write-Host "Frontend is UP!" -ForegroundColor Green
} catch {
  Write-Host "Frontend starting... May take 10-20 seconds for Vite rebuild" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "NGROK CONFIGURATION:" -ForegroundColor Cyan
Write-Host "  Frontend URL: $ngrokUrl" -ForegroundColor White
Write-Host "  Backend API:  $backendNgrokUrl" -ForegroundColor White
Write-Host ""
Write-Host "QR CODE SẼ CHỨA:" -ForegroundColor Cyan
Write-Host "  $ngrokUrl/payment/qr-confirm?order_id=XXX" -ForegroundColor White
Write-Host ""
Write-Host "ĐIỆN THOẠI SẼ GỌI API:" -ForegroundColor Cyan
Write-Host "  $backendNgrokUrl/api/v1/payments/qr/confirm" -ForegroundColor White
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Truy cập: $ngrokUrl" -ForegroundColor White
Write-Host "2. Login: admin@gmail.com / admin@123" -ForegroundColor White
Write-Host "3. Thêm sản phẩm vào giỏ → Checkout" -ForegroundColor White
Write-Host "4. Chọn 'Thanh toán bằng QR' → Tạo đơn hàng" -ForegroundColor White
Write-Host "5. QR code hiển thị → Quét bằng điện thoại" -ForegroundColor White
Write-Host "6. Điện thoại mở: $ngrokUrl/payment/qr-confirm?order_id=XXX" -ForegroundColor White
Write-Host "7. Nhấn 'Đã thanh toán' → Đơn hàng được xác nhận!" -ForegroundColor White
Write-Host ""
Write-Host "NOTE: Mỗi lần restart ngrok, chạy lại script này với URL mới" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test nhanh với script: .\test_qr_complete.ps1" -ForegroundColor Cyan
