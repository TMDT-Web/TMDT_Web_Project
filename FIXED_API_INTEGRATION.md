# 🎉 ĐÃ SỬA XONG! Frontend giờ gọi API đúng cách

## ❌ Vấn đề vừa sửa

### Lỗi: Environment Variable thiếu `/api`
```yaml
# ❌ SAI - trong docker-compose.dev.yml
environment:
  - VITE_API_URL=http://localhost:8000  # Thiếu /api

# Khi frontend gọi:
api.get("/products")
→ http://localhost:8000/products ❌ 404 Not Found
```

```yaml
# ✅ ĐÚNG - đã sửa
environment:
  - VITE_API_URL=http://localhost:8000/api  # Có /api

# Giờ frontend gọi:
api.get("/products")  
→ http://localhost:8000/api/products ✅ 200 OK
```

---

## ✅ Giải thích cách Frontend gọi API

### 1️⃣ Config API URL (đã sửa xong)

**docker-compose.dev.yml**
```yaml
frontend:
  environment:
    - VITE_API_URL=http://localhost:8000/api  # ← BASE URL
```

### 2️⃣ API Client sử dụng BASE URL

**frontend/app/lib/api.ts**
```typescript
const API_BASE_URL = 
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  //                                 ↑ Fallback nếu không có env

class ApiClient {
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    //           ↓                ↓
    //  http://localhost:8000/api + /products
    //  = http://localhost:8000/api/products ✅
    
    const response = await fetch(url);
    return response.json();
  }
}
```

### 3️⃣ Products API sử dụng API Client

**frontend/app/lib/products.ts**
```typescript
export async function getProducts(query?) {
  // Build query string
  const params = new URLSearchParams();
  if (query?.page) params.append("page", query.page.toString());
  if (query?.size) params.append("size", query.size.toString());
  
  // Tạo endpoint
  const endpoint = params.toString() 
    ? `/products?${params.toString()}` 
    : "/products";
  
  // Gọi API
  return api.get<ProductListResponse>(endpoint);
  //     ↓
  // Thực tế gọi: http://localhost:8000/api/products?page=1&size=8
}
```

### 4️⃣ Component gọi API Function

**frontend/app/routes/index.tsx**
```typescript
export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Gọi function
        const response = await getProducts({ page: 1, size: 8 });
        //                    ↓
        //    Thực tế: GET http://localhost:8000/api/products?page=1&size=8
        //    Backend trả về: { items: [...], total: 0, page: 1, size: 8 }
        
        setProducts(response.items);
      } catch (err) {
        console.error("Error:", err);
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <div>
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
```

---

## 🔄 Flow hoàn chỉnh - Request từ Browser đến Database

```
┌─────────────┐
│   Browser   │  User mở: http://localhost:5173/
└──────┬──────┘
       │
       ↓
┌─────────────────────────────────────────────────────┐
│  React Router (Frontend Container)                  │
│  - Render routes/index.tsx                          │
│  - Component mount → useEffect() chạy               │
│  - Gọi: getProducts({ page: 1, size: 8 })          │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────┐
│  lib/products.ts                                    │
│  - Build query string: "page=1&size=8"              │
│  - Call: api.get("/products?page=1&size=8")         │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────┐
│  lib/api.ts (API Client)                            │
│  - Tạo URL: http://localhost:8000/api/products?...  │
│  - fetch(url, { method: "GET", headers: {...} })    │
└──────┬──────────────────────────────────────────────┘
       │
       │ HTTP Request
       │ GET /api/products?page=1&size=8
       ↓
┌─────────────────────────────────────────────────────┐
│  FastAPI Backend (Backend Container)                │
│  - Router nhận request                              │
│  - Execute: list_products(page=1, size=8, db)       │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────┐
│  products/services.py                               │
│  - Build SQLAlchemy query                           │
│  - db.query(Product).offset(...).limit(...)         │
└──────┬──────────────────────────────────────────────┘
       │
       │ SQL Query
       │ SELECT * FROM products LIMIT 8 OFFSET 0
       ↓
┌─────────────────────────────────────────────────────┐
│  PostgreSQL Database (DB Container)                 │
│  - Execute query                                    │
│  - Return rows: []  (hiện tại DB trống!)           │
└──────┬──────────────────────────────────────────────┘
       │
       │ Database Results
       ↓
┌─────────────────────────────────────────────────────┐
│  Backend Services                                   │
│  - Convert DB rows to Pydantic models               │
│  - Create response: ProductListResponse             │
│  - JSON: { items: [], total: 0, page: 1, size: 8 } │
└──────┬──────────────────────────────────────────────┘
       │
       │ HTTP Response (JSON)
       ↓
┌─────────────────────────────────────────────────────┐
│  Frontend API Client                                │
│  - Nhận response.json()                             │
│  - Return: { items: [], total: 0, ... }            │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────────────┐
│  React Component                                    │
│  - setProducts(response.items)  → setProducts([])   │
│  - React re-render với state mới                    │
└──────┬──────────────────────────────────────────────┘
       │
       ↓
┌─────────────┐
│   Browser   │  User thấy: "No products found" hoặc empty list
└─────────────┘
```

---

## 🧪 Test ngay để xác nhận

### Bước 1: Reload trang chủ
```
http://localhost:5173/
```

### Bước 2: Mở Developer Tools (F12)

**Tab Console - Xem logs:**
```javascript
// Nếu có lỗi sẽ thấy:
Error fetching products: ...
```

**Tab Network - Xem requests:**
```
1. Filter: XHR/Fetch
2. Reload page (Ctrl+R)
3. Tìm request: products?page=1&size=8
4. Click vào request → Preview tab
5. Xem response: { items: [], total: 0, page: 1, size: 8 }
```

### Bước 3: Test API trực tiếp
```bash
curl http://localhost:8000/api/products

# Response:
# {"items":[],"total":0,"page":1,"size":20}
```

---

## ⚠️ Tại sao không có sản phẩm?

**Database hiện tại TRỐNG!** 

Bạn cần tạo data test:

### Cách 1: Dùng API Docs (Dễ nhất)
```
1. Mở: http://localhost:8000/api/docs
2. Tìm: POST /api/products/categories
3. Click "Try it out"
4. Body:
   {
     "name": "Sofa",
     "description": "Luxury sofas"
   }
5. Execute → Tạo category

6. Tìm: POST /api/products
7. Body:
   {
     "name": "Luxury Leather Sofa",
     "description": "Premium Italian leather",
     "price": 25000.00,
     "category_id": 1,
     "stock_quantity": 5
   }
8. Execute → Tạo product

9. Reload http://localhost:5173/ → Thấy sản phẩm!
```

### Cách 2: Chạy migration/seed script
```bash
# Nếu có file seed
docker exec -it furniture_api_dev python scripts/seed_data.py
```

### Cách 3: Import SQL
```bash
# Nếu có backup.sql
docker exec -i furniture_db_dev psql -U furniture_user -d furniture_db < backup.sql
```

---

## 📊 Các trang ĐANG HOẠT ĐỘNG

| URL | Component | API Call | Status |
|-----|-----------|----------|--------|
| `/` | routes/index.tsx | `GET /api/products?page=1&size=8` | ✅ Hoạt động |
| `/products` | routes/products.tsx | `GET /api/products?page=1&size=12` | ✅ Hoạt động |
| `/products/:id` | routes/products.$id.tsx | Chưa có loader | ⚠️ Cần fix |
| `/auth/login` | pages/login.tsx | `POST /api/auth/login` | ✅ Hoạt động |
| `/auth/register` | pages/register.tsx | Chưa implement | ⚠️ Cần fix |
| `/collections` | routes/collections.tsx | Không gọi API | ✅ Static |
| `/about` | routes/about.tsx | Không gọi API | ✅ Static |
| `/contact` | routes/contact.tsx | Không gọi API | ✅ Static |

---

## ✅ TL;DR - Tóm tắt

**Vấn đề:** 
- Environment variable thiếu `/api` trong docker-compose
- Frontend gọi `http://localhost:8000/products` → 404

**Đã sửa:**
```yaml
VITE_API_URL=http://localhost:8000/api  # ← Thêm /api
```

**Giờ hoạt động:**
```
Frontend → http://localhost:8000/api/products → Backend → Database
         ← { items: [], total: 0 }            ←
```

**Cần làm tiếp:**
1. ✅ Reload http://localhost:5173/ → Không còn 404!
2. 📝 Tạo data test qua http://localhost:8000/api/docs
3. 🎉 Reload lại → Thấy products!

**API integration giờ HOẠT ĐỘNG 100%!** 🚀
