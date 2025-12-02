# Test Google Login Flow
Write-Host "🧪 Testing Google OAuth Flow..." -ForegroundColor Cyan

# 1. Test backend API
Write-Host "`n1️⃣ Testing Backend API..." -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/google/login" -Method Get
if ($response.auth_url) {
    Write-Host "✅ Backend API working - Got auth_url" -ForegroundColor Green
    Write-Host "Auth URL: $($response.auth_url.Substring(0, 100))..." -ForegroundColor Gray
} else {
    Write-Host "❌ Backend API failed" -ForegroundColor Red
    exit 1
}

# 2. Test frontend proxy
Write-Host "`n2️⃣ Testing Frontend Proxy..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/google/login" -Method Get
    if ($frontendResponse.auth_url) {
        Write-Host "✅ Frontend proxy working" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend proxy failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend proxy error: $_" -ForegroundColor Red
}

# 3. Check frontend build
Write-Host "`n3️⃣ Checking Frontend Build..." -ForegroundColor Yellow
$jsFiles = docker exec luxefurniture_frontend ls /usr/share/nginx/html/assets/ | Select-String "index.*\.js"
Write-Host "JS files: $jsFiles" -ForegroundColor Gray

# 4. Check for old alert code
Write-Host "`n4️⃣ Checking for old code..." -ForegroundColor Yellow
$oldCode = docker exec luxefurniture_frontend grep -i "phát triển" /usr/share/nginx/html/assets/*.js 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Found old code in build!" -ForegroundColor Red
    Write-Host $oldCode
} else {
    Write-Host "✅ No old code found" -ForegroundColor Green
}

# 5. Instructions
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3000/login" -ForegroundColor White
Write-Host "2. Press Ctrl+Shift+R to hard refresh (clear cache)" -ForegroundColor White
Write-Host "3. Open DevTools (F12) → Network tab → Check 'Disable cache'" -ForegroundColor White
Write-Host "4. Reload page and click Google button" -ForegroundColor White
Write-Host "5. Should redirect to Google (will fail with demo credentials)" -ForegroundColor White

Write-Host "`n🔧 To fix permanently, set up real Google OAuth:" -ForegroundColor Yellow
Write-Host "See: GOOGLE_OAUTH_NOTIFICATION_SETUP.md" -ForegroundColor Gray
