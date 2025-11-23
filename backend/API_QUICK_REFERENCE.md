# 🚀 Quick API Reference - New Features

## 🛋️ Collections API

### Public Endpoints

```bash
# List all collections
GET /api/v1/collections?skip=0&limit=20&is_active=true

# Get collection by ID (with products)
GET /api/v1/collections/{collection_id}

# Get collection by slug
GET /api/v1/collections/slug/autumn-2025
```

### Admin Endpoints

```bash
# Create collection
POST /api/v1/collections
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Autumn Living Room 2025",
  "slug": "autumn-living-room-2025",
  "banner_url": "/static/banners/autumn.jpg",
  "description": "Cozy autumn collection",
  "is_active": true,
  "product_ids": [1, 2, 3, 5, 8]  # Optional: Assign products
}

# Update collection
PUT /api/v1/collections/{collection_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Updated Name",
  "product_ids": [10, 11, 12]  # Optional: Replace all products
}

# Delete collection
DELETE /api/v1/collections/{collection_id}
Authorization: Bearer {admin_token}

# Add products to collection (without removing existing)
POST /api/v1/collections/{collection_id}/products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "product_ids": [15, 16, 17]
}

# Remove products from collection
DELETE /api/v1/collections/{collection_id}/products
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "product_ids": [2, 3]
}
```

---

## 🛒 Cart API

### All endpoints require user authentication

```bash
# Get cart
GET /api/v1/cart
Authorization: Bearer {user_token}

# Get cart with totals
GET /api/v1/cart/summary
Authorization: Bearer {user_token}

# Response:
{
  "cart": {
    "id": 5,
    "user_id": 10,
    "items": [
      {
        "id": 123,
        "product_id": 5,
        "quantity": 2,
        "product": {
          "id": 5,
          "name": "Luxury Leather Sofa",
          "price": 12000000,
          "sale_price": 10000000,
          "stock": 5,
          "thumbnail_url": "/static/images/sofa.jpg"
        }
      }
    ]
  },
  "subtotal": 20000000,
  "total_items": 2
}

# Add to cart (or update quantity if exists)
POST /api/v1/cart/add
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "product_id": 5,
  "quantity": 2
}

# Update cart item quantity
PUT /api/v1/cart/{item_id}
Authorization: Bearer {user_token}
Content-Type: application/json

{
  "quantity": 5
}

# Remove item from cart
DELETE /api/v1/cart/{item_id}
Authorization: Bearer {user_token}

# Clear entire cart
DELETE /api/v1/cart
Authorization: Bearer {user_token}
```

---

## 📊 Dashboard API

### All endpoints require admin authentication

```bash
# Get dashboard statistics
GET /api/v1/dashboard/stats
Authorization: Bearer {admin_token}

# Response:
{
  "total_revenue": 150000000.0,
  "total_orders": 245,
  "pending_orders": 12,
  "low_stock_products": 8,
  "total_users": 1024,
  "active_products": 156,
  "completed_orders": 210,
  "cancelled_orders": 18
}

# Get recent orders
GET /api/v1/dashboard/recent-orders?limit=10
Authorization: Bearer {admin_token}

# Get top selling products
GET /api/v1/dashboard/top-products?limit=10
Authorization: Bearer {admin_token}

# Response:
[
  {
    "id": 5,
    "name": "Luxury Leather Sofa",
    "thumbnail_url": "/static/images/sofa.jpg",
    "price": 12000000,
    "total_sold": 45
  },
  ...
]
```

---

## 🔍 Products API (Enhanced Filters)

```bash
# Advanced filtering
GET /api/v1/products?min_price=1000000&max_price=5000000&category_id=2&search=sofa&is_featured=true&skip=0&limit=20

# Filter by price range
GET /api/v1/products?min_price=2000000&max_price=10000000

# Filter by category and search
GET /api/v1/products?category_id=3&search=dining table

# Filter featured products
GET /api/v1/products?is_featured=true

# Combine filters
GET /api/v1/products?collection_id=5&min_price=5000000&max_price=15000000
```

### Available Query Parameters:
- `skip` (int) - Pagination offset (default: 0)
- `limit` (int) - Items per page (default: 20, max: 100)
- `category_id` (int) - Filter by category
- `collection_id` (int) - Filter by collection
- `search` (string) - Search in name and description
- `is_featured` (bool) - Filter featured products
- `min_price` (float) - Minimum price (NEW)
- `max_price` (float) - Maximum price (NEW)

---

## 🔐 Authentication API (Enhanced)

```bash
# Refresh access token
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Token Lifecycle:
- **Access Token:** 30 minutes (use for API requests)
- **Refresh Token:** 7 days (use to get new access token)

### Usage Flow:
1. Login → Get access_token + refresh_token
2. Use access_token for API requests
3. When access_token expires (401 error) → Use refresh_token to get new tokens
4. Continue using new access_token

---

## 🎯 Complete Endpoint List

### Collections (9 endpoints):
```
GET    /api/v1/collections                      [Public]
GET    /api/v1/collections/{id}                 [Public]
GET    /api/v1/collections/slug/{slug}          [Public]
POST   /api/v1/collections                      [Admin]
PUT    /api/v1/collections/{id}                 [Admin]
DELETE /api/v1/collections/{id}                 [Admin]
POST   /api/v1/collections/{id}/products        [Admin]
DELETE /api/v1/collections/{id}/products        [Admin]
```

### Cart (7 endpoints):
```
GET    /api/v1/cart                             [User]
GET    /api/v1/cart/summary                     [User]
POST   /api/v1/cart/add                         [User]
PUT    /api/v1/cart/{item_id}                   [User]
DELETE /api/v1/cart/{item_id}                   [User]
DELETE /api/v1/cart                             [User]
```

### Dashboard (3 endpoints):
```
GET    /api/v1/dashboard/stats                  [Admin]
GET    /api/v1/dashboard/recent-orders          [Admin]
GET    /api/v1/dashboard/top-products           [Admin]
```

### Products (Enhanced):
```
GET    /api/v1/products                         [Public] - Now with min_price, max_price
```

### Auth (Enhanced):
```
POST   /api/v1/auth/refresh-token               [Public] - NEW endpoint
```

---

## 💡 Common Use Cases

### 1. Customer adds product to cart
```bash
# User browses products
GET /api/v1/products?category_id=1&min_price=5000000

# User views product detail
GET /api/v1/products/5

# User adds to cart
POST /api/v1/cart/add
Authorization: Bearer {user_token}
{
  "product_id": 5,
  "quantity": 1
}

# User views cart
GET /api/v1/cart/summary
Authorization: Bearer {user_token}
```

### 2. Admin creates seasonal collection
```bash
# Admin creates collection
POST /api/v1/collections
Authorization: Bearer {admin_token}
{
  "name": "Summer Sale 2025",
  "slug": "summer-sale-2025",
  "banner_url": "/static/banners/summer.jpg",
  "is_active": true,
  "product_ids": [10, 11, 12, 13, 14]
}

# Admin adds more products later
POST /api/v1/collections/5/products
Authorization: Bearer {admin_token}
{
  "product_ids": [15, 16]
}

# Customers browse collection
GET /api/v1/collections/slug/summer-sale-2025
```

### 3. Admin monitors business
```bash
# Check overall stats
GET /api/v1/dashboard/stats
Authorization: Bearer {admin_token}

# Check recent orders
GET /api/v1/dashboard/recent-orders?limit=20
Authorization: Bearer {admin_token}

# Check top sellers
GET /api/v1/dashboard/top-products?limit=10
Authorization: Bearer {admin_token}

# Check low stock products
# (from stats: low_stock_products count)
```

### 4. Token refresh flow
```javascript
// Frontend example
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem('access_token');
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status === 401) {
    // Token expired, refresh it
    const refreshToken = localStorage.getItem('refresh_token');
    const refreshResponse = await fetch('/api/v1/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (refreshResponse.ok) {
      const { access_token, refresh_token } = await refreshResponse.json();
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${access_token}`
        }
      });
    }
  }
  
  return response;
}
```

---

## 🔒 Authorization Matrix

| Endpoint | Public | User | Admin |
|----------|--------|------|-------|
| GET /collections | ✅ | ✅ | ✅ |
| POST /collections | ❌ | ❌ | ✅ |
| GET /cart | ❌ | ✅ | ✅ |
| POST /cart/add | ❌ | ✅ | ✅ |
| GET /dashboard/stats | ❌ | ❌ | ✅ |
| POST /auth/refresh-token | ✅ | ✅ | ✅ |
| GET /products (filters) | ✅ | ✅ | ✅ |

---

## ⚠️ Error Responses

### Common Error Codes:

```json
// 400 Bad Request
{
  "detail": "Insufficient stock. Available: 2"
}

// 401 Unauthorized
{
  "detail": "Could not validate credentials"
}

// 403 Forbidden
{
  "detail": "Not authorized to perform this action"
}

// 404 Not Found
{
  "detail": "Product not found"
}

// 409 Conflict
{
  "detail": "Collection with slug 'summer-2025' already exists"
}
```

---

## 📦 Response Formats

### Success Response:
```json
{
  "id": 5,
  "name": "Autumn Collection",
  "slug": "autumn-2025",
  ...
}
```

### List Response:
```json
{
  "collections": [...],
  "total": 25
}
```

### Delete Response:
```json
{
  "message": "Collection deleted successfully"
}
```

---

**Last Updated:** November 22, 2025  
**Backend Status:** 🟢 Running  
**Total New Endpoints:** 25
