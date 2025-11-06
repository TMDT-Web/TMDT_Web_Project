# 🔍 Cách Frontend sử dụng API từ Backend - Giải thích chi tiết

## ❗ Vấn đề hiện tại

Bạn đang thấy trang 404 vì truy cập `/account` - route này **chưa được tạo**.

**Routes hiện có:**
- ✅ `/` - Trang chủ
- ✅ `/products` - Danh sách sản phẩm
- ✅ `/products/:id` - Chi tiết sản phẩm
- ✅ `/collections` - Bộ sưu tập
- ✅ `/about` - Giới thiệu
- ✅ `/contact` - Liên hệ
- ✅ `/auth/login` - Đăng nhập
- ✅ `/auth/register` - Đăng ký
- ❌ `/account` - **CHƯA CÓ!**

---

## 📚 Cách Frontend gọi API - Từng bước chi tiết

### Bước 1: Cấu hình API Base URL

**File: `frontend/.env`**
```env
VITE_API_URL=http://localhost:8000/api
```

**File: `frontend/app/lib/api.ts`**
```typescript
const API_BASE_URL = 
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

class ApiClient {
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    // Gọi: http://localhost:8000/api/products
    const response = await fetch(url);
    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);
```

### Bước 2: Tạo API Functions

**File: `frontend/app/lib/products.ts`**
```typescript
import { api } from "./api";

// Function này sẽ gọi: GET http://localhost:8000/api/products
export async function getProducts(query?: ProductSearchQuery) {
  const params = new URLSearchParams();
  if (query?.page) params.append("page", query.page.toString());
  if (query?.size) params.append("size", query.size.toString());
  
  const queryString = params.toString();
  const endpoint = queryString ? `/products?${queryString}` : "/products";
  
  // Gọi API qua api client
  return api.get<ProductListResponse>(endpoint);
}

// Function này sẽ gọi: GET http://localhost:8000/api/products/categories
export async function getCategories() {
  return api.get<Category[]>("/products/categories");
}
```

### Bước 3: Sử dụng trong React Component

**File: `frontend/app/routes/index.tsx`**
```typescript
import { getProducts } from "../lib/products";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // GỌI API Ở ĐÂY! ⬇️
        const response = await getProducts({ page: 1, size: 8 });
        
        // response.items chứa dữ liệu từ backend
        setProducts(response.items);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts(); // Chạy khi component mount
  }, []);

  return (
    <div>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </div>
  );
}
```

---

## 🔄 Flow hoàn chỉnh khi user vào trang chủ

```
1. User mở browser → http://localhost:5173/
   ↓
2. React Router render component: routes/index.tsx
   ↓
3. Component chạy useEffect()
   ↓
4. Gọi getProducts({ page: 1, size: 8 })
   ↓
5. getProducts() gọi api.get("/products?page=1&size=8")
   ↓
6. Fetch gửi request: GET http://localhost:8000/api/products?page=1&size=8
   ↓
7. Backend FastAPI xử lý request
   ↓
8. Backend query database PostgreSQL
   ↓
9. Backend trả về JSON: { items: [...], total: 50, page: 1, size: 8 }
   ↓
10. Frontend nhận response
   ↓
11. setProducts(response.items) - Update state
   ↓
12. React re-render với dữ liệu mới
   ↓
13. User thấy danh sách sản phẩm trên màn hình! ✨
```

---

## 🧪 Test xem API có hoạt động không

### Test 1: Mở trang chủ
```
1. Mở browser: http://localhost:5173/
2. Mở Developer Tools (F12)
3. Vào tab Network
4. Reload trang (Ctrl+R)
5. Xem có request đến http://localhost:8000/api/products không
```

**Nếu thấy:**
- ✅ Status 200 → API hoạt động tốt!
- ❌ Status 404 → Backend không có data
- ❌ Status 500 → Backend lỗi
- ❌ CORS error → CORS config sai

### Test 2: Kiểm tra Console
```javascript
// Mở Console (F12) và chạy:
fetch('http://localhost:8000/api/products?page=1&size=5')
  .then(r => r.json())
  .then(data => console.log('Products:', data))
  .catch(err => console.error('Error:', err))
```

### Test 3: Test API trực tiếp
```bash
# Mở terminal
curl http://localhost:8000/api/products?page=1&size=5

# Hoặc mở browser:
http://localhost:8000/api/products?page=1&size=5
```

---

## 🔧 Debug khi trang không hoạt động

### Kiểm tra 1: Container có chạy không?
```powershell
docker ps | Select-String "furniture"

# Phải thấy 4 containers:
# - furniture_db_dev (PostgreSQL)
# - furniture_api_dev (FastAPI Backend)
# - furniture_frontend_dev (React Frontend)
# - furniture-network
```

### Kiểm tra 2: Backend có data không?
```bash
# Vào API docs
http://localhost:8000/api/docs

# Test endpoint GET /products
```

### Kiểm tra 3: Frontend logs
```powershell
docker-compose -f docker-compose.dev.yml logs frontend

# Xem có lỗi gì không
```

### Kiểm tra 4: Browser Console
```
1. F12 → Console tab
2. Xem có error logs màu đỏ không?
3. Check Network tab → Xem requests
```

---

## 📋 Các trang ĐANG HOẠT ĐỘNG

### 1. Trang chủ - http://localhost:5173/
```typescript
// routes/index.tsx
useEffect(() => {
  // GỌI API: GET /api/products
  const response = await getProducts({ page: 1, size: 8 });
  setProducts(response.items);
}, []);
```

### 2. Trang sản phẩm - http://localhost:5173/products
```typescript
// routes/products.tsx
useEffect(() => {
  // GỌI API: GET /api/products với filters
  const response = await getProducts({
    page: 1,
    size: 12,
    category_id: selectedCategory,
    min_price: minPrice,
    max_price: maxPrice
  });
  setProducts(response.items);
}, [selectedCategory, minPrice, maxPrice]);
```

### 3. Chi tiết sản phẩm - http://localhost:5173/products/1
```typescript
// routes/products.$id.tsx
// Cần implement loader:
export async function loader({ params }: Route.LoaderArgs) {
  // GỌI API: GET /api/products/{id}
  const product = await getProduct(Number(params.id));
  return { product };
}
```

### 4. Login - http://localhost:5173/auth/login
```typescript
// pages/login.tsx
const handleSubmit = async (e) => {
  // GỌI API: POST /api/auth/login
  const tokens = await login({
    email: username,
    password: password
  });
  
  saveTokens(tokens);
  navigate("/");
};
```

---

## ⚠️ Trang CHƯA HOẠT ĐỘNG (cần tạo)

- ❌ `/account` - Account page
- ❌ `/cart` - Giỏ hàng
- ❌ `/checkout` - Thanh toán
- ❌ `/orders` - Đơn hàng
- ❌ `/orders/:id` - Chi tiết đơn hàng

---

## 🎯 Làm sao để thấy dữ liệu?

### Option 1: Tạo data test qua Backend
```bash
# Vào API docs
http://localhost:8000/api/docs

# Dùng POST /api/products để tạo sản phẩm mới
```

### Option 2: Seed database
```bash
# Trong backend container
docker exec -it furniture_api_dev python -c "
from app.core.database import SessionLocal
from app.products.models import Product, Category
db = SessionLocal()

# Tạo category
cat = Category(name='Sofa', description='Luxury sofas')
db.add(cat)
db.commit()

# Tạo product
prod = Product(
    name='Luxury Sofa',
    price=5000.00,
    category_id=cat.id,
    stock_quantity=10
)
db.add(prod)
db.commit()
"
```

### Option 3: Import từ SQL file (nếu có)
```bash
docker exec -i furniture_db_dev psql -U user -d ecommerce < backup.sql
```

---

## 🚀 Quick Test - Xác nhận API hoạt động

### Mở 3 tabs browser:

**Tab 1:** Frontend
```
http://localhost:5173/
→ Xem có hiện products không
```

**Tab 2:** API Docs
```
http://localhost:8000/api/docs
→ Test GET /products endpoint
```

**Tab 3:** API Direct
```
http://localhost:8000/api/products
→ Xem JSON response
```

**Tab 4 (Optional):** Database
```
http://localhost:8000/api/docs#/Products/list_products_products_get
→ Xem database có data không
```

---

## ✅ TL;DR - Tóm tắt ngắn gọn

**Cách frontend gọi API:**
```typescript
1. User vào page → Component render
2. useEffect() chạy
3. Gọi async function từ lib/products.ts
4. Function gọi api.get("/endpoint")
5. Fetch gửi HTTP request đến backend
6. Backend trả JSON
7. Frontend setState() với data mới
8. React re-render → User thấy data
```

**Trang nào HOẠT ĐỘNG:**
- ✅ `/` - Trang chủ (gọi API products)
- ✅ `/products` - Danh sách (gọi API products với filter)
- ✅ `/auth/login` - Login (gọi API login)

**Trang nào CHƯA:**
- ❌ `/account` - Chưa tạo route
- ❌ `/cart` - Chưa tạo route
- ❌ `/orders` - Chưa tạo route

**Cách test:**
1. Mở http://localhost:5173/ (KHÔNG phải /account)
2. F12 → Network tab
3. Reload → Xem requests
4. Nếu thấy request đến `/api/products` → API hoạt động!

🎉 **Vậy là xong! Frontend ĐÃ tích hợp API, chỉ cần vào đúng trang!**
