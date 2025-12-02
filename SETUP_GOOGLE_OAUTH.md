# Hướng dẫn Setup Google OAuth - Từng bước chi tiết

## Bước 1: Truy cập Google Cloud Console

1. Mở trình duyệt và vào: https://console.cloud.google.com/
2. Đăng nhập bằng tài khoản Google của bạn
3. Nếu chưa có project, click **"Create Project"** (Tạo dự án)
   - Đặt tên project: `LuxeFurniture` (hoặc tên bạn muốn)
   - Click **"Create"**

## Bước 2: Bật Google+ API

1. Trong Google Cloud Console, vào menu bên trái
2. Chọn **"APIs & Services"** → **"Library"**
3. Tìm kiếm: `Google+ API` hoặc `People API`
4. Click vào và nhấn **"Enable"** (Bật)

## Bước 3: Tạo OAuth 2.0 Credentials

1. Vào **"APIs & Services"** → **"Credentials"**
2. Click nút **"+ CREATE CREDENTIALS"** ở trên
3. Chọn **"OAuth client ID"**

### 3.1. Configure Consent Screen (nếu chưa setup)

Nếu bạn thấy thông báo phải configure consent screen trước:

1. Click **"CONFIGURE CONSENT SCREEN"**
2. Chọn **"External"** (Bên ngoài) → Click **"CREATE"**
3. Điền thông tin:
   - **App name**: `LuxeFurniture` (tên ứng dụng)
   - **User support email**: Email của bạn
   - **Developer contact email**: Email của bạn
4. Click **"SAVE AND CONTINUE"** → Skip các bước tiếp theo
5. Quay lại **"Credentials"** để tạo OAuth client ID

### 3.2. Tạo OAuth Client ID

1. **Application type**: Chọn **"Web application"**
2. **Name**: Đặt tên `LuxeFurniture Web Client`
3. **Authorized JavaScript origins**: Thêm:
   ```
   http://localhost:3000
   ```
4. **Authorized redirect URIs**: Thêm:
   ```
   http://localhost:8000/api/v1/auth/google/callback
   ```
5. Click **"CREATE"**

### 3.3. Copy Credentials

Sau khi tạo xong, sẽ xuất hiện popup với:
- **Client ID**: Một chuỗi dài kết thúc bằng `.apps.googleusercontent.com`
- **Client Secret**: Một chuỗi ngắn hơn

**LƯU Ý**: Copy 2 giá trị này, chúng ta sẽ dùng ở bước tiếp theo!

## Bước 4: Cập nhật file .env

1. Mở file `backend/.env` trong VS Code
2. Tìm các dòng:
   ```env
   GOOGLE_CLIENT_ID=demo-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=demo-client-secret
   ```
3. Thay thế bằng giá trị thật từ Google Cloud Console:
   ```env
   GOOGLE_CLIENT_ID=<YOUR_REAL_CLIENT_ID_HERE>
   GOOGLE_CLIENT_SECRET=<YOUR_REAL_CLIENT_SECRET_HERE>
   ```

## Bước 5: Restart Backend

Chạy lệnh sau trong PowerShell:

```powershell
docker-compose restart backend
```

## Bước 6: Test Google Login

1. Mở trình duyệt ở chế độ Incognito/Private (để tránh cache)
2. Vào: http://localhost:3000/login
3. Click nút **"Google"**
4. Bạn sẽ được chuyển đến trang đăng nhập Google
5. Chọn tài khoản và cho phép quyền truy cập
6. Sau khi thành công, bạn sẽ được chuyển về trang chủ và đã đăng nhập

## Khắc phục sự cố

### Lỗi: "redirect_uri_mismatch"

- Kiểm tra lại **Authorized redirect URIs** trong Google Cloud Console
- Phải là: `http://localhost:8000/api/v1/auth/google/callback`
- Chính xác từng ký tự, không có dấu `/` thừa ở cuối

### Lỗi: "Access blocked: This app is not verified"

- Đây là cảnh báo bình thường khi app đang ở chế độ testing
- Click **"Advanced"** → **"Go to LuxeFurniture (unsafe)"**
- Hoặc thêm email test vào OAuth consent screen

### Lỗi: "Google OAuth not configured"

- Kiểm tra file `backend/.env` đã có GOOGLE_CLIENT_ID thật chưa
- Chạy lại: `docker-compose restart backend`

## Video hướng dẫn

Nếu bạn muốn xem video hướng dẫn chi tiết hơn, search YouTube:
"How to create Google OAuth credentials" hoặc "Google Cloud Console OAuth setup"

---

**Nếu gặp khó khăn ở bước nào, hãy chụp màn hình và hỏi tôi!**
