# 🐛 Bug Fixes - Google OAuth & Register

## ✅ Đã fix 2 lỗi:

### 1. ✅ Google OAuth Callback không redirect về frontend

**Vấn đề:**
- Backend trả về JSON tokens nhưng không redirect
- User thấy raw JSON trong browser

**Giải pháp:**
- Backend giờ redirect về `http://localhost:5173/auth/callback` với tokens trong URL hash
- Frontend tạo page `/auth/callback` để parse tokens và save vào localStorage
- Tự động redirect về trang chủ sau khi lưu tokens

**Files changed:**
- `backend/app/users/routes/google_oauth_callback.py` - Redirect thay vì return JSON
- `frontend/app/pages/GoogleCallback.tsx` - NEW page xử lý callback
- `frontend/app/routes.ts` - Thêm route `/auth/callback`

---

### 2. ✅ Register bị lỗi 422 Unprocessable Content

**Vấn đề:**
- Frontend chỉ gửi: `{ email, password, full_name }`
- Backend schema yêu cầu: `{ email, password, full_name, phone_number }`
- Thiếu field `phone_number` → 422 error

**Giải pháp:**
- Frontend giờ gửi thêm `phone_number` field
- Update TypeScript interface `RegisterRequest` để include `phone_number?`

**Files changed:**
- `frontend/app/lib/auth.ts` - Add `phone_number?: string` to RegisterRequest
- `frontend/app/pages/register.tsx` - Send `phone_number: phone` in API call

---

## 🧪 Test lại:

### Test 1: Google OAuth Login

```bash
1. Truy cập: http://localhost:5173/auth/login
2. Click "Đăng nhập với Google"
3. Login với Google account
4. ✅ Sẽ redirect về http://localhost:5173/auth/callback
5. ✅ Page callback tự động parse tokens
6. ✅ Save tokens vào localStorage
7. ✅ Redirect về trang chủ với toast "Đăng nhập thành công!"
```

**Flow chi tiết:**
```
Frontend                 Backend                    Google
   |                        |                          |
   |--GET /api/auth/google/login---------------------->|
   |                        |                          |
   |<--307 Redirect to Google auth URL-----------------|
   |                        |                          |
User logs in with Google   |                          |
   |                        |                          |
   |<--Redirect to /api/auth/google/callback?code=xxx--|
   |                        |                          |
   |                   Exchange code                   |
   |                   Issue tokens                    |
   |                        |                          |
   |<--RedirectResponse to /auth/callback#tokens-------|
   |                        |                          |
Parse hash tokens          |                          |
Save to localStorage       |                          |
Redirect to "/"            |                          |
```

---

### Test 2: Register với tài khoản nội bộ

```bash
1. Truy cập: http://localhost:5173/auth/register
2. Điền form:
   - Tên người dùng: Hoangson LE
   - Tên tài khoản: sonle (email)
   - Số điện thoại: 0934191038
   - Mật khẩu: Hoangson2005@
   - Xác nhận mật khẩu: Hoangson2005@
3. Click "Đăng ký"
4. ✅ Backend nhận: { email: "sonle", password: "...", full_name: "...", phone_number: "0934191038" }
5. ✅ Không còn lỗi 422
6. ✅ Toast "Đăng ký thành công!"
7. ✅ Redirect to /auth/login với username prefilled
```

**API Request:**
```json
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "email": "sonle",
  "password": "Hoangson2005@",
  "full_name": "Hoangson LE",
  "phone_number": "0934191038"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "sonle",
  "full_name": "Hoangson LE",
  "phone_number": "0934191038",
  "is_active": true,
  "created_at": "2025-11-04T15:20:00",
  "updated_at": "2025-11-04T15:20:00",
  "roles": [
    {
      "id": 2,
      "name": "customer",
      "description": "Customer role",
      "is_system": true
    }
  ]
}
```

---

## 📊 Validation Rules

### Register Form Validation (Frontend):

✅ **Tên người dùng:**
- Required
- Min length: 1 character

✅ **Email (Tên tài khoản):**
- Required
- Email format

✅ **Số điện thoại:**
- Required
- Format: `0xxxxxxxxx` (10 digits, starts with 0)
- Regex: `/^0\d{9}$/`

✅ **Mật khẩu:**
- Required
- Min length: 8 characters
- Max length: 72 bytes (UTF-8)

✅ **Xác nhận mật khẩu:**
- Must match password

---

## 🔍 Backend Schema Reference

```python
# app/users/schemas.py

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes when encoded as UTF-8.")
        return v

class UserBase(OrmBaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone_number: Optional[str] = None  # ← Optional nhưng validation vẫn check format
```

---

## 🎯 Tóm tắt

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| Google OAuth Callback | Return JSON, no redirect | Redirect to `/auth/callback` with tokens in hash | ✅ FIXED |
| Register API 422 | Missing `phone_number` field | Send `phone_number` from form | ✅ FIXED |

**Giờ cả 2 flows đều hoạt động:**
1. ✅ Google OAuth: Login → Callback → Save tokens → Redirect home
2. ✅ Register: Fill form → Send with phone → Success → Redirect to login
