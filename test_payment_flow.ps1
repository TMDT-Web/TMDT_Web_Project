# Test Payment Flow - End-to-End
Write-Host "=== PAYMENT FLOW TEST ===" -ForegroundColor Cyan

# 1. Login
Write-Host "`n[1/5] Login..." -ForegroundColor Yellow
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

# 2. Create order for VNPay
Write-Host "`n[2/5] Create order (VNPay)..." -ForegroundColor Yellow
$order_body = @{
  full_name = "Test User"
  phone_number = "0123456789"
  shipping_address = "123 Test Street"
  payment_method = "vnpay"
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

# 3. Create VNPay payment
Write-Host "`n[3/5] Init VNPay payment..." -ForegroundColor Yellow
$vnpay_body = @{ order_id = $order_id; gateway = "vnpay" } | ConvertTo-Json

try {
  $vnpay_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/payments/create" -Method POST -Headers $headers -Body $vnpay_body).Content | ConvertFrom-Json
  $vnpay_url = $vnpay_resp.payment_url
  if ($vnpay_url) {
    Write-Host "[OK] VNPay URL generated" -ForegroundColor Green
    Write-Host "URL: $vnpay_url" -ForegroundColor Cyan
  } else {
    Write-Host "[WARN] No payment_url in response" -ForegroundColor Yellow
    Write-Host ($vnpay_resp | ConvertTo-Json) -ForegroundColor Yellow
  }
} catch {
  Write-Host "[ERROR] VNPay init failed: $_" -ForegroundColor Red
}

# 4. Create order for Momo
Write-Host "`n[4/5] Create order (Momo)..." -ForegroundColor Yellow
$order2_body = @{
  full_name = "Test User 2"
  phone_number = "0987654321"
  shipping_address = "456 Another St"
  payment_method = "momo"
  items = @(@{ product_id = 2; quantity = 1 })
} | ConvertTo-Json -Depth 5

try {
  $order2_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/orders" -Method POST -Headers $headers -Body $order2_body).Content | ConvertFrom-Json
  $order2_id = $order2_resp.id
  Write-Host "[OK] Order ID: $order2_id" -ForegroundColor Green
  
  # 5. Create Momo payment
  Write-Host "`n[5/5] Init Momo payment..." -ForegroundColor Yellow
  $momo_body = @{ order_id = $order2_id; gateway = "momo" } | ConvertTo-Json
  
  $momo_resp = (Invoke-WebRequest -Uri "http://localhost:8000/api/v1/payments/create" -Method POST -Headers $headers -Body $momo_body).Content | ConvertFrom-Json
  $momo_url = $momo_resp.payment_url
  if ($momo_url) {
    Write-Host "[OK] Momo URL generated" -ForegroundColor Green
    Write-Host "URL: $momo_url" -ForegroundColor Cyan
  } else {
    Write-Host "[WARN] No payment_url in Momo response" -ForegroundColor Yellow
    Write-Host ($momo_resp | ConvertTo-Json) -ForegroundColor Yellow
  }
} catch {
  Write-Host "[ERROR] Momo operations failed: $_" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host "Next: Open http://localhost:3000 and test checkout flow" -ForegroundColor Yellow
