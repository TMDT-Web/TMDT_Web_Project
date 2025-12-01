# Test QR Payment Flow - Complete (No Auth for Confirmation)

Write-Host "=== QR PAYMENT COMPLETE FLOW TEST ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n[1/4] Login..." -ForegroundColor Yellow
$login_body = "username=admin@gmail.com&password=admin@123"
$login_headers = @{ "Content-Type" = "application/x-www-form-urlencoded" }
try {
  $login_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -Headers $login_headers -Body $login_body).Content | ConvertFrom-Json
  $token = $login_resp.access_token
  Write-Host "[OK] Token received" -ForegroundColor Green
} catch {
  Write-Host "[ERROR] Login failed: $_" -ForegroundColor Red
  exit 1
}

# 2. Create order
Write-Host "`n[2/4] Create order with QR payment..." -ForegroundColor Yellow
$order_body = @{
  full_name = "QR Test User"
  phone_number = "0123456789"
  shipping_address = "123 QR Test Street"
  payment_method = "qr_code"
  items = @(@{ product_id = 1; quantity = 1 })
} | ConvertTo-Json -Depth 5

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
try {
  $order_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/orders" -Method POST -Headers $headers -Body $order_body).Content | ConvertFrom-Json
  $order_id = $order_resp.id
  Write-Host "[OK] Order ID: $order_id, Total: $($order_resp.total_amount) VND" -ForegroundColor Green
  Write-Host "Order Status: $($order_resp.status), Is Paid: $($order_resp.is_paid)" -ForegroundColor Cyan
} catch {
  Write-Host "[ERROR] Create order failed: $_" -ForegroundColor Red
  exit 1
}

# 3. Generate QR Code
Write-Host "`n[3/4] Generate QR Code..." -ForegroundColor Yellow
$qr_body = @{ order_id = $order_id } | ConvertTo-Json

try {
  $qr_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/payments/qr/generate" -Method POST -Headers $headers -Body $qr_body).Content | ConvertFrom-Json
  if ($qr_resp.success) {
    Write-Host "[OK] QR Code generated for order #$($qr_resp.order_id)" -ForegroundColor Green
    Write-Host "Amount: $($qr_resp.amount) VND" -ForegroundColor Cyan
    Write-Host "QR Code data (first 100 chars): $($qr_resp.qr_code.Substring(0, 100))..." -ForegroundColor Gray
    
    # Extract confirmation URL from QR
    Write-Host "`nConfirmation URL encoded in QR:" -ForegroundColor Yellow
    Write-Host "http://localhost:3000/payment/qr-confirm?order_id=$order_id" -ForegroundColor Cyan
  } else {
    Write-Host "[ERROR] $($qr_resp.message)" -ForegroundColor Red
  }
} catch {
  Write-Host "[ERROR] Generate QR failed: $_" -ForegroundColor Red
  exit 1
}

# 4. Simulate mobile confirmation (NO AUTH REQUIRED)
Write-Host "`n[4/4] Simulate mobile QR confirmation (public endpoint)..." -ForegroundColor Yellow
$confirm_body = @{ order_id = $order_id } | ConvertTo-Json
$public_headers = @{ "Content-Type" = "application/json" }  # No authorization header

try {
  $confirm_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/payments/qr/confirm" -Method POST -Headers $public_headers -Body $confirm_body).Content | ConvertFrom-Json
  if ($confirm_resp.success) {
    Write-Host "[OK] Payment confirmed successfully!" -ForegroundColor Green
    Write-Host "Message: $($confirm_resp.message)" -ForegroundColor Green
    Write-Host "Order ID: $($confirm_resp.order_id)" -ForegroundColor Cyan
    Write-Host "Order Status: $($confirm_resp.status)" -ForegroundColor Cyan
  } else {
    Write-Host "[ERROR] $($confirm_resp.message)" -ForegroundColor Red
  }
} catch {
  Write-Host "[ERROR] Confirm payment failed: $_" -ForegroundColor Red
  exit 1
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "`nHOW TO USE WITH NGROK:" -ForegroundColor Cyan
Write-Host "1. Run: ngrok http 3000" -ForegroundColor White
Write-Host "2. Get ngrok URL (e.g., https://abcd1234.ngrok.io)" -ForegroundColor White
Write-Host "3. Set env: `$env:FRONTEND_BASE_URL='https://abcd1234.ngrok.io'" -ForegroundColor White
Write-Host "4. Restart: docker-compose restart backend" -ForegroundColor White
Write-Host "5. Create order and generate QR → QR will have ngrok URL" -ForegroundColor White
Write-Host "6. Scan QR with phone → Opens confirmation page on phone" -ForegroundColor White
Write-Host "7. Tap 'Da thanh toan' → Order status changes to CONFIRMED" -ForegroundColor White
