# Deploy Backend lên Render.com - Chi tiết từng bước

## Bước 1: Đăng ký Render.com

1. Truy cập: https://render.com/
2. Click **"Get Started"**
3. Đăng ký bằng GitHub account (để dễ import repo)

## Bước 2: Tạo PostgreSQL Database

1. Từ Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Điền thông tin:
   ```
   Name: luxefurniture-db
   Database: luxefurniture
   User: luxefurniture_user
   Region: Singapore (hoặc gần nhất)
   Plan: Free
   ```
3. Click **"Create Database"**
4. Đợi ~2 phút để database được khởi tạo
5. **LƯU LẠI** connection string (dạng: `postgresql://user:pass@host/db`)

## Bước 3: Deploy Backend Web Service

### 3.1. Tạo Web Service

1. Click **"New +"** → **"Web Service"**
2. **Connect GitHub repository**: `TMDT-Web/TMDT_Web_Project`
3. Nếu chưa connect: Click "Connect account" → Authorize Render

### 3.2. Cấu hình Service

```
Name: luxefurniture-api
Region: Singapore (same as database)
Branch: main
Root Directory: backend
Environment: Docker
Dockerfile Path: ./Dockerfile
Docker Build Context: ./backend
Instance Type: Free
```

### 3.3. Thêm Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

**Bắt buộc:**
```
DATABASE_URL = [Paste connection string từ bước 2]
SECRET_KEY = [Generate random string: openssl rand -hex 32]
ALGORITHM = HS256
ACCESS_TOKEN_EXPIRE_MINUTES = 10080
```

**CORS (Quan trọng):**
```
ALLOWED_ORIGINS = https://your-frontend.vercel.app,http://localhost:3000
```
*(Thay `your-frontend.vercel.app` bằng domain Vercel thực tế sau khi deploy frontend)*

**Optional:**
```
ENVIRONMENT = production
```

### 3.4. Deploy

1. Click **"Create Web Service"**
2. Render sẽ:
   - Clone repo từ GitHub
   - Build Docker image
   - Chạy migrations (alembic upgrade head)
   - Start server
3. Đợi ~5-10 phút cho lần deploy đầu
4. Kiểm tra logs nếu có lỗi

## Bước 4: Lấy Backend URL

Sau khi deploy thành công:
```
URL: https://luxefurniture-api.onrender.com
API Docs: https://luxefurniture-api.onrender.com/docs
Health: https://luxefurniture-api.onrender.com/health
```

**LƯU LẠI URL này** để config frontend!

## Bước 5: Deploy Frontend lên Vercel

1. Truy cập: https://vercel.com
2. **"Add New"** → **"Project"**
3. Import: `TMDT-Web/TMDT_Web_Project`
4. Cấu hình:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
5. **Environment Variables**:
   ```
   VITE_API_URL = https://luxefurniture-api.onrender.com
   ```
6. Click **"Deploy"**

## Bước 6: Cập nhật CORS

Sau khi có URL Vercel (VD: `luxefurniture.vercel.app`):

1. Quay lại Render Dashboard
2. Vào service **luxefurniture-api**
3. Tab **"Environment"**
4. Sửa `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS = https://luxefurniture.vercel.app,http://localhost:3000
   ```
5. Service sẽ tự động redeploy

## Bước 7: Test

1. Truy cập frontend: `https://your-frontend.vercel.app`
2. Test các chức năng:
   - Đăng ký/Đăng nhập
   - Xem sản phẩm
   - Thêm vào giỏ hàng
   - Đặt hàng
3. Check API Docs: `https://your-backend.onrender.com/docs`

## Troubleshooting

### Database Connection Failed
```bash
# Kiểm tra DATABASE_URL format
postgresql://user:password@host:port/database

# Test connection
psql $DATABASE_URL
```

### Build Failed
- Check logs trong Render dashboard
- Verify `requirements.txt` có đầy đủ dependencies
- Đảm bảo Dockerfile syntax đúng

### CORS Errors
```python
# Verify ALLOWED_ORIGINS trong Render env vars
# Format: https://domain1.com,https://domain2.com (NO SPACES!)
```

### API Returns 502
- Database chưa ready → Đợi thêm vài phút
- Check logs: Tab "Logs" trong Render dashboard
- Verify DATABASE_URL đúng format

### Free Tier Limitations
- Backend sẽ **sleep sau 15 phút không dùng**
- Request đầu tiên sau khi sleep mất ~30s để wake up
- 750 giờ/tháng miễn phí (đủ cho 1 instance chạy liên tục)

## Auto Deploy

Render tự động deploy khi:
- Push code lên GitHub `main` branch
- Merge pull request vào `main`

## Monitoring

- **Logs**: Render Dashboard → Service → "Logs" tab
- **Metrics**: Dashboard hiển thị CPU, Memory, Requests
- **Health Check**: Render ping `/docs` mỗi phút

## Upgrade Plan (Nếu cần)

Free tier đủ cho development. Nếu cần production:

**Starter Plan ($7/month)**:
- No sleep
- Faster builds
- More resources

**Standard Plan ($25/month)**:
- Horizontal scaling
- Priority support
- Custom domains

## Commands Hữu Ích

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Test database connection locally
psql postgresql://user:pass@host/db

# Check API health
curl https://your-api.onrender.com/health

# View logs
# → Render Dashboard → Logs tab
```

## Next Steps

1. ✅ Backend deployed lên Render
2. ✅ Frontend deployed lên Vercel
3. ✅ Database setup và migrations chạy
4. 📝 Add custom domain (optional)
5. 📝 Setup monitoring/alerts
6. 📝 Add CI/CD tests before deploy

---

**Thời gian deploy ước tính**: 15-20 phút cho lần đầu

**Chi phí**: $0 (Free tier đủ dùng cho demo/development)
