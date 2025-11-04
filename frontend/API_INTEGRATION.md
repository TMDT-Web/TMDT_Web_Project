# Kết nối Frontend - Backend

## 📋 Tóm tắt thay đổi

Đã chuyển từ **dữ liệu tạm (mock data)** sang **dữ liệu thực từ database**.

### ✅ Các file đã tạo:

1. **`app/lib/api.ts`** - API client để gọi backend
2. **`app/lib/types.ts`** - TypeScript types cho Product, Category
3. **`app/lib/products.ts`** - Functions để lấy dữ liệu sản phẩm
4. **`.env`** - Cấu hình API URL

### ✅ Các thay đổi chính:

- ✨ Trang chủ giờ lấy sản phẩm từ API backend
- 🖼️ Hiển thị hình ảnh thật từ `main_image` field
- 📄 Phân trang dựa trên tổng số sản phẩm thực tế
- ⏳ Có loading state khi đang tải dữ liệu
- ❌ Hiển thị error message nếu kết nối thất bại
- 🏷️ Hiển thị đúng số lượng tồn kho từ database

## 🚀 Cách chạy

### 1️⃣ Khởi động Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 2️⃣ Khởi động Frontend

```bash
cd frontend
npm run dev
```

## 🔧 Cấu hình

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api
```

### Backend CORS (trong `backend/.env`)

```env
CORS_ALLOW_ORIGINS=http://localhost:5173
```

## 📡 API Endpoints đang sử dụng

| Endpoint             | Method | Mô tả                                 |
| -------------------- | ------ | ------------------------------------- |
| `/api/products`      | GET    | Lấy danh sách sản phẩm với phân trang |
| `/api/products/{id}` | GET    | Lấy chi tiết 1 sản phẩm               |
| `/api/categories`    | GET    | Lấy danh sách categories              |

### Query Parameters cho `/api/products`:

- `page`: Trang hiện tại (mặc định: 1)
- `size`: Số sản phẩm/trang (mặc định: 20)
- `category_id`: Lọc theo danh mục
- `min_price`, `max_price`: Lọc theo giá
- `q`: Tìm kiếm theo tên

## 🎯 Cấu trúc dữ liệu

### ProductListItem (hiển thị trong danh sách)

```typescript
{
  id: number;
  name: string;
  price: number;
  main_image: string | null;
  stock_quantity: number;
  is_active: boolean;
}
```

## 💡 Lưu ý

1. **Backend phải chạy trước** để frontend có thể lấy dữ liệu
2. **Database cần có dữ liệu** sản phẩm để hiển thị
3. Nếu chưa có dữ liệu, có thể:
   - Chạy migrations: `cd backend && alembic upgrade head`
   - Thêm sản phẩm qua API (cần admin auth)
   - Import dữ liệu từ SQL file

## 🐛 Troubleshooting

### Lỗi CORS

```
Access to fetch at 'http://localhost:8000/api/products' has been blocked by CORS policy
```

**Giải pháp:** Kiểm tra `CORS_ALLOW_ORIGINS` trong backend `.env` và restart backend

### Không có sản phẩm hiển thị

- Mở DevTools (F12) > Network tab để xem API response
- Kiểm tra database có dữ liệu không
- Thử gọi API trực tiếp: http://localhost:8000/api/products

### Backend không chạy

```
Không thể tải danh sách sản phẩm
```

**Giải pháp:** Khởi động backend ở port 8000
