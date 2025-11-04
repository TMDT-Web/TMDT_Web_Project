# Hướng dẫn kết nối Frontend với Backend

## Các thay đổi đã thực hiện

### 1. Tạo API Client (`app/lib/api.ts`)

- Client để giao tiếp với backend API
- Hỗ trợ GET, POST, PATCH, DELETE methods
- Tự động xử lý headers và JSON

### 2. Tạo TypeScript Types (`app/lib/types.ts`)

- Định nghĩa types cho Product, Category, Tag
- Khớp với schema của backend
- Type-safe cho toàn bộ ứng dụng

### 3. Tạo Product API Functions (`app/lib/products.ts`)

- `getProducts()`: Lấy danh sách sản phẩm với phân trang và filter
- `getProduct(id)`: Lấy chi tiết 1 sản phẩm
- `getCategories()`: Lấy danh sách categories

### 4. Cập nhật Home Page

- Sử dụng `useEffect` để fetch dữ liệu từ API
- Hiển thị loading state khi đang tải
- Hiển thị error message nếu có lỗi
- Sử dụng dữ liệu thực từ database thay vì mock data
- Hiển thị hình ảnh sản phẩm từ `main_image` field
- Phân trang dựa trên `total` từ API

## Cấu hình

### Frontend `.env` file

```
VITE_API_URL=http://localhost:8000/api
```

### Backend CORS settings

Backend cần cấu hình CORS để cho phép frontend kết nối:

```python
# backend/.env
CORS_ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Chạy ứng dụng

### 1. Chạy Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

Backend sẽ chạy ở: http://localhost:8000

### 2. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy ở: http://localhost:5173

## API Endpoints được sử dụng

- `GET /api/products` - Lấy danh sách sản phẩm
  - Query params: `page`, `size`, `category_id`, `min_price`, `max_price`, `q` (search)
  - Response: `{ items: [], total: number, page: number, size: number }`

- `GET /api/products/{id}` - Lấy chi tiết sản phẩm
  - Response: Product object với đầy đủ thông tin

- `GET /api/categories` - Lấy danh sách categories
  - Response: Array of Category objects

## Cấu trúc dữ liệu

### ProductListItem

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

### Category

```typescript
{
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}
```

## Lưu ý

1. **Backend phải chạy trước** khi frontend có thể lấy dữ liệu
2. **Database phải có dữ liệu** để hiển thị sản phẩm
3. Nếu không có sản phẩm trong database, trang sẽ hiển thị trống
4. Có thể sử dụng Postman collection trong `backend/postman_collection.json` để test API
5. Để thêm sản phẩm mẫu, có thể sử dụng API POST `/api/products` (yêu cầu admin authentication)

## Troubleshooting

### Lỗi CORS

Nếu gặp lỗi CORS, kiểm tra:

- Backend `.env` có `CORS_ALLOW_ORIGINS` chứa URL của frontend
- Backend đã restart sau khi thay đổi `.env`

### Lỗi "Cannot connect to API"

- Kiểm tra backend có đang chạy không
- Kiểm tra URL trong frontend `.env` đúng không
- Kiểm tra port của backend (mặc định 8000)

### Không có sản phẩm hiển thị

- Kiểm tra database có dữ liệu không
- Kiểm tra response từ API bằng browser DevTools > Network tab
- Chạy migrations nếu chưa: `cd backend && alembic upgrade head`
