# Auto-configure ngrok for QR payment
Write-Host "=== AUTO NGROK CONFIG ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get local IP
Write-Host "[1/5] Getting local IP address..." -ForegroundColor Yellow
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*"} | Select-Object -First 1).IPAddress
if (-not $localIP) {
    $localIP = "192.168.1.10"
    Write-Host "  → Could not detect IP, using default: $localIP" -ForegroundColor Yellow
} else {
    Write-Host "  → Found: $localIP" -ForegroundColor Green
}
$backendUrl = "http://${localIP}:8000"

# Step 2: Check if ngrok is running
Write-Host ""
Write-Host "[2/5] Checking ngrok status..." -ForegroundColor Yellow
$ngrokUrl = $null
try {
    $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    foreach ($tunnel in $tunnels.tunnels) {
        $port = $tunnel.config.addr -replace '.*:(\d+).*', '$1'
        if ($port -eq "3000") {
            $ngrokUrl = $tunnel.public_url
            Write-Host "  ✓ Ngrok đang chạy: $ngrokUrl" -ForegroundColor Green
            break
        }
    }
} catch {
    Write-Host "  ✗ Ngrok chưa chạy!" -ForegroundColor Red
}

# Step 3: Start ngrok if not running
if (-not $ngrokUrl) {
    Write-Host ""
    Write-Host "[3/5] Starting ngrok tunnel..." -ForegroundColor Yellow
    Write-Host "  → Chạy lệnh: ngrok http 3000" -ForegroundColor Gray
    
    # Start ngrok in background
    $ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http 3000" -PassThru -WindowStyle Minimized
    
    Write-Host "  → Đợi ngrok khởi động..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Try to get URL again
    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        foreach ($tunnel in $tunnels.tunnels) {
            $port = $tunnel.config.addr -replace '.*:(\d+).*', '$1'
            if ($port -eq "3000") {
                $ngrokUrl = $tunnel.public_url
                Write-Host "  ✓ Ngrok started: $ngrokUrl" -ForegroundColor Green
                break
            }
        }
    } catch {
        Write-Host "  ✗ Không thể lấy ngrok URL!" -ForegroundColor Red
        Write-Host ""
        Write-Host "HƯỚNG DẪN THỰC HIỆN THỦ CÔNG:" -ForegroundColor Yellow
        Write-Host "1. Mở terminal mới" -ForegroundColor White
        Write-Host "2. Chạy: ngrok http 3000" -ForegroundColor White
        Write-Host "3. Xem dòng 'Forwarding' (VD: https://abc.ngrok-free.dev)" -ForegroundColor White
        Write-Host "4. Copy URL đó và chạy lại script này" -ForegroundColor White
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "[3/5] Ngrok already running ✓" -ForegroundColor Green
}

# Step 4: Update .env files
Write-Host ""
Write-Host "[4/5] Updating configuration..." -ForegroundColor Yellow

# Backend .env
$backendEnvContent = @()
if (Test-Path .env) {
    $backendEnvContent = Get-Content .env | Where-Object { $_ -notmatch '^FRONTEND_BASE_URL=' }
}
$backendEnvContent += "FRONTEND_BASE_URL=$ngrokUrl"
$backendEnvContent | Set-Content .env -Encoding UTF8
Write-Host "  ✓ Backend .env: FRONTEND_BASE_URL=$ngrokUrl" -ForegroundColor Green

# Frontend .env
$frontendEnvContent = @()
if (Test-Path frontend/.env) {
    $frontendEnvContent = Get-Content frontend/.env | Where-Object { $_ -notmatch '^VITE_API_URL=' }
}
$frontendEnvContent += "VITE_API_URL=$backendUrl"
$frontendEnvContent | Set-Content frontend/.env -Encoding UTF8
Write-Host "  ✓ Frontend .env: VITE_API_URL=$backendUrl" -ForegroundColor Green

# Step 5: Restart services
Write-Host ""
Write-Host "[5/5] Restarting services..." -ForegroundColor Yellow
docker-compose restart backend frontend | Out-Null
Start-Sleep -Seconds 3
Write-Host "  ✓ Services restarted" -ForegroundColor Green

# Done
Write-Host ""
Write-Host "=== HOÀN TẤT ===" -ForegroundColor Green
Write-Host ""
Write-Host "CẤU HÌNH:" -ForegroundColor Cyan
Write-Host "  Frontend (ngrok):    $ngrokUrl" -ForegroundColor White
Write-Host "  Backend (local IP):  $backendUrl" -ForegroundColor White
Write-Host ""
Write-Host "QR CODE SẼ CHỨA:" -ForegroundColor Cyan
Write-Host "  $ngrokUrl/payment/qr-confirm?order_id=XXX" -ForegroundColor White
Write-Host ""
Write-Host "KHI ĐIỆN THOẠI QUÉT QR:" -ForegroundColor Cyan
Write-Host "  1. Mở link: $ngrokUrl/payment/qr-confirm?order_id=XXX" -ForegroundColor White
Write-Host "  2. Trang web call API: $backendUrl/api/v1/payments/qr/confirm" -ForegroundColor White
Write-Host "  3. Bấm 'Đã thanh toán' → Xác nhận thành công!" -ForegroundColor White
Write-Host ""
Write-Host "LƯU Ý QUAN TRỌNG:" -ForegroundColor Yellow
Write-Host "  • Điện thoại và máy tính PHẢI cùng mạng WiFi!" -ForegroundColor Red
Write-Host "  • Nếu vẫn lỗi network, tắt firewall Windows" -ForegroundColor Red
Write-Host ""
Write-Host "TEST NGAY:" -ForegroundColor Green
Write-Host "  1. Mở điện thoại: $ngrokUrl" -ForegroundColor White
Write-Host "  2. Login: admin@gmail.com / admin@123" -ForegroundColor White
Write-Host "  3. Tạo đơn hàng với QR payment" -ForegroundColor White
Write-Host "  4. Quét QR → Bấm 'Đã thanh toán'" -ForegroundColor White
Write-Host ""
