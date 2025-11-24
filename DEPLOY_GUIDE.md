# Deploy Guide - LuxeFurniture

## Deploy Frontend lên Vercel

### Cách 1: Vercel Dashboard (Khuyến nghị)

1. **Đăng nhập Vercel**: https://vercel.com/login
2. **Import Project**:
   ```
   - Click "Add New" → "Project"
   - Connect GitHub account
   - Select repository: TMDT-Web/TMDT_Web_Project
   - Click "Import"
   ```

3. **Cấu hình Project**:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables** (Quan trọng):
   ```
   VITE_API_URL = https://your-backend-url.com
   ```
   *(Thay bằng URL backend thực tế)*

5. **Deploy**: Click "Deploy" và đợi ~2-3 phút

6. **Domain**: Vercel sẽ cung cấp domain miễn phí: `your-project.vercel.app`

### Cách 2: Vercel CLI

```bash
# Cài đặt Vercel CLI
npm install -g vercel

# Navigate to frontend folder
cd frontend

# Deploy
vercel

# Hoặc deploy production
vercel --prod
```

**Trả lời các câu hỏi**:
- Set up and deploy? `Y`
- Which scope? Chọn account của bạn
- Link to existing project? `N`
- What's your project's name? `luxefurniture`
- In which directory is your code located? `./`
- Want to override the settings? `N`

### Sau khi Deploy

1. **Kiểm tra build logs** nếu có lỗi
2. **Test website** tại URL Vercel cung cấp
3. **Cập nhật env variables** nếu cần thay đổi API URL

## Deploy Backend

### Option 1: Render.com (Free tier)

1. Đăng ký: https://render.com
2. **New Web Service** → Connect GitHub repo
3. Cấu hình:
   ```
   Name: luxefurniture-api
   Environment: Docker
   Branch: main
   Root Directory: backend
   ```
4. **Environment Variables**:
   ```
   DATABASE_URL = postgresql://...
   SECRET_KEY = your-secret-key
   ALLOWED_ORIGINS = https://your-frontend.vercel.app
   ```

### Option 2: Railway.app (Free tier)

1. Đăng ký: https://railway.app
2. **New Project** → Deploy from GitHub repo
3. Select `backend` directory
4. Railway tự động detect Dockerfile
5. Thêm PostgreSQL database addon
6. Cấu hình environment variables

### Option 3: Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create luxefurniture-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set env vars
heroku config:set SECRET_KEY=your-secret-key
heroku config:set ALLOWED_ORIGINS=https://your-frontend.vercel.app

# Deploy
git subtree push --prefix backend heroku main
```

## Troubleshooting

### Frontend không connect được Backend
- Kiểm tra `VITE_API_URL` trong Vercel environment variables
- Đảm bảo backend cho phép CORS từ domain Vercel
- Check backend logs

### Build failed
- Xem logs trong Vercel dashboard
- Đảm bảo `package.json` có đầy đủ dependencies
- Test build locally: `npm run build`

### API calls trả về 404
- Verify API URL trong browser console
- Check network tab trong DevTools
- Đảm bảo backend đang chạy

## Notes

- **Free tier Vercel**: Unlimited deployments, 100GB bandwidth/month
- **Auto deploy**: Mỗi khi push lên GitHub, Vercel tự động deploy
- **Preview deployments**: Mỗi PR sẽ có preview URL riêng
- **Custom domain**: Có thể add custom domain miễn phí
