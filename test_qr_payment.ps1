# Test QR Payment Flow

Write-Host "=== QR PAYMENT FLOW TEST ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n[1/4] Login..." -ForegroundColor Yellow
$login_body = "username=admin@gmail.com&password=admin@123"
$login_headers = @{ "Content-Type" = "application/x-www-form-urlencoded" }
try {
  $login_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -Headers $login_headers -Body $login_body).Content | ConvertFrom-Json
  $token = $login_resp.access_token
  Write-Host "[OK] Token received (length: $($token.Length))" -ForegroundColor Green
} catch {
  Write-Host "[ERROR] Login failed: $_" -ForegroundColor Red
  exit 1
}

# 2. Create order
Write-Host "`n[2/4] Create order..." -ForegroundColor Yellow
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
  Write-Host "[OK] Order ID: $order_id, Total: $($order_resp.total_amount)" -ForegroundColor Green
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
    Write-Host "QR Code (base64, first 80 chars): $($qr_resp.qr_code.Substring(0, 80))..." -ForegroundColor Cyan
  } else {
    Write-Host "[ERROR] $($qr_resp.message)" -ForegroundColor Red
  }
} catch {
  Write-Host "[ERROR] Generate QR failed: $_" -ForegroundColor Red
}

# 4. Confirm QR Payment
Write-Host "`n[4/4] Confirm QR Payment..." -ForegroundColor Yellow
$confirm_body = @{ order_id = $order_id } | ConvertTo-Json

try {
  $confirm_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/payments/qr/confirm" -Method POST -Headers $headers -Body $confirm_body).Content | ConvertFrom-Json
  if ($confirm_resp.success) {
    Write-Host "[OK] Payment confirmed!" -ForegroundColor Green
    Write-Host "Message: $($confirm_resp.message)" -ForegroundColor Green
  } else {
    Write-Host "[ERROR] $($confirm_resp.message)" -ForegroundColor Red
  }
} catch {
  Write-Host "[ERROR] Confirm payment failed: $_" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "Next: Open http://localhost:3000 and test QR payment from Checkout" -ForegroundColor Yellow
