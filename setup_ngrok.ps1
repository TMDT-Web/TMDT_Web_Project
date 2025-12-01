# ==============================================================================
# HƯỚNG DẪN SETUP NGROK CHO QR PAYMENT
# ==============================================================================

Write-Host "=== SETUP NGROK FOR QR PAYMENT ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[BƯỚC 1] Cài đặt ngrok" -ForegroundColor Yellow
Write-Host "1. Tải ngrok: https://ngrok.com/download" -ForegroundColor White
Write-Host "2. Giải nén vào thư mục (VD: C:\ngrok)" -ForegroundColor White
Write-Host "3. Đăng ký tài khoản tại: https://dashboard.ngrok.com/signup" -ForegroundColor White
Write-Host "4. Lấy authtoken tại: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
Write-Host ""

Write-Host "[BƯỚC 2] Authenticate ngrok (chỉ cần làm 1 lần)" -ForegroundColor Yellow
Write-Host "Chạy lệnh: ngrok authtoken YOUR_TOKEN_HERE" -ForegroundColor White
Write-Host ""

Write-Host "[BƯỚC 3] Start ngrok tunnel cho frontend" -ForegroundColor Yellow
Write-Host "Mở terminal mới và chạy:" -ForegroundColor White
Write-Host "  ngrok http 3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ngrok sẽ hiển thị public URL, ví dụ:" -ForegroundColor White
Write-Host "  https://abcd1234.ngrok.io -> http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "[BƯỚC 4] Cấu hình backend sử dụng ngrok URL" -ForegroundColor Yellow
Write-Host "Copy URL ngrok (https://abcd1234.ngrok.io) và chạy lệnh sau:" -ForegroundColor White
Write-Host ""
Write-Host '  $ngrokUrl = "https://abcd1234.ngrok.io"  # Thay bằng URL thật' -ForegroundColor Cyan
Write-Host '  $env:FRONTEND_BASE_URL = $ngrokUrl' -ForegroundColor Cyan
Write-Host '  docker-compose restart backend' -ForegroundColor Cyan
Write-Host ""

Write-Host "[BƯỚC 5] Test QR payment" -ForegroundColor Yellow
Write-Host "1. Truy cập: http://localhost:3000 hoặc https://abcd1234.ngrok.io" -ForegroundColor White
Write-Host "2. Tạo đơn hàng với payment method = QR Code" -ForegroundColor White
Write-Host "3. QR code sẽ chứa URL ngrok: https://abcd1234.ngrok.io/payment/qr-confirm?order_id=X" -ForegroundColor White
Write-Host "4. Quét QR bằng điện thoại → Trang confirmation mở trên điện thoại" -ForegroundColor White
Write-Host "5. Nhấn 'Đã thanh toán' → Order status đổi thành CONFIRMED" -ForegroundColor White
Write-Host ""

Write-Host "=== LƯU Ý ===" -ForegroundColor Red
Write-Host "- Ngrok free: URL thay đổi mỗi lần restart (trừ khi có paid plan)" -ForegroundColor Yellow
Write-Host "- Mỗi lần ngrok restart, phải set lại FRONTEND_BASE_URL và restart backend" -ForegroundColor Yellow
Write-Host "- Backend API vẫn chạy trên localhost:8000 (không cần expose backend)" -ForegroundColor Yellow
Write-Host ""

Write-Host "=== SCRIPT TỰ ĐỘNG (Sau khi start ngrok) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host 'Chạy script này sau khi có ngrok URL:' -ForegroundColor White
Write-Host ''
Write-Host '$ngrokUrl = Read-Host "Nhập ngrok URL (VD: https://abcd1234.ngrok.io)"'
Write-Host 'if ($ngrokUrl) {'
Write-Host '  Write-Host "Setting FRONTEND_BASE_URL=$ngrokUrl" -ForegroundColor Green'
Write-Host '  $env:FRONTEND_BASE_URL = $ngrokUrl'
Write-Host '  Write-Host "Restarting backend..." -ForegroundColor Yellow'
Write-Host '  docker-compose restart backend'
Write-Host '  Write-Host ""'
Write-Host '  Write-Host "DONE! QR codes will now use: $ngrokUrl" -ForegroundColor Green'
Write-Host '  Write-Host "Test: Create order -> Generate QR -> Scan with phone" -ForegroundColor Cyan'
Write-Host '}'
Write-Host ''
