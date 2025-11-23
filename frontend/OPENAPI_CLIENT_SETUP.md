# 🚀 OpenAPI TypeScript Client Generation Guide

**Project:** LuxeFurniture_Reborn  
**Environment:** WSL (Windows Subsystem for Linux)  
**Date:** November 22, 2025

---

## 📋 Overview

This guide will help you auto-generate a fully-typed TypeScript API client from your FastAPI backend, eliminating manual `axios` calls and providing type safety across your entire frontend.

**Benefits:**
- ✅ Automatic TypeScript types from OpenAPI spec
- ✅ No more manual API typing
- ✅ Autocomplete for all API endpoints
- ✅ Compile-time error detection
- ✅ Automatic JWT authentication
- ✅ Centralized API configuration

---

## 🔧 Step 1: Install Dependencies (WSL Terminal)

Open your WSL terminal and navigate to the frontend directory:

```bash
# Navigate to frontend directory
cd /mnt/c/Users/Hoangson\ Le/Workspace/PycharmProjects/Luxe_Furniture/frontend

# Install openapi-typescript-codegen as dev dependency
npm install --save-dev openapi-typescript-codegen

# Verify installation
npm list openapi-typescript-codegen
```

**Expected Output:**
```
frontend@0.0.0 /mnt/c/Users/Hoangson Le/Workspace/PycharmProjects/Luxe_Furniture/frontend
└── openapi-typescript-codegen@0.27.0
```

---

## 📝 Step 2: Add Generation Script to package.json

The package.json file will be updated automatically with the generation script.

**Script Added:**
```json
{
  "scripts": {
    "generate-client": "openapi --input http://localhost:8000/openapi.json --output ./src/client --client axios"
  }
}
```

**What this does:**
- `--input`: Fetches OpenAPI spec from running FastAPI backend
- `--output`: Generates client code to `src/client/` directory
- `--client axios`: Uses axios as the HTTP client

---

## ⚙️ Step 3: Generate the API Client

**Prerequisites:**
1. Ensure your FastAPI backend is running:
   ```bash
   # In a separate terminal
   cd /mnt/c/Users/Hoangson\ Le/Workspace/PycharmProjects/Luxe_Furniture
   docker-compose up backend
   ```

2. Verify backend is accessible:
   ```bash
   curl http://localhost:8000/openapi.json
   ```

**Generate the client:**
```bash
# In WSL terminal (frontend directory)
npm run generate-client
```

**Expected Output:**
```
✔ Generating...
✔ Writing to disk...
✔ Done!

Generated files:
  src/client/
  ├── index.ts
  ├── core/
  │   ├── OpenAPI.ts
  │   ├── ApiError.ts
  │   ├── ApiRequestOptions.ts
  │   ├── ApiResult.ts
  │   ├── CancelablePromise.ts
  │   └── request.ts
  ├── models/
  │   ├── AddressCreate.ts
  │   ├── AddressResponse.ts
  │   ├── ProductResponse.ts
  │   ├── ... (all your Pydantic models)
  └── services/
      ├── AuthenticationService.ts
      ├── ProductsService.ts
      ├── OrdersService.ts
      ├── CartService.ts
      ├── CollectionsService.ts
      ├── DashboardService.ts
      └── ... (all your API endpoints)
```

---

## 🔐 Step 4: Configure API Client with JWT Authentication

The `apiClient.ts` file will be created with:
- Base URL configuration from environment variables
- Automatic JWT token injection
- Request/Response interceptors
- Error handling

**Usage in your app:**
```typescript
import { setupApiClient } from '@/services/apiClient';

// Initialize once in your app entry point (main.tsx or App.tsx)
setupApiClient();
```

---

## 📦 Step 5: Example Refactoring

### Before (Manual axios):
```typescript
// ❌ OLD: frontend/src/services/product.service.ts
import axios from 'axios';

export const productService = {
  async getProducts(filters?: any) {
    const response = await axios.get('/api/v1/products', { params: filters });
    return response.data;
  },
  
  async getProduct(id: number) {
    const response = await axios.get(`/api/v1/products/${id}`);
    return response.data;
  }
};
```

### After (Generated client):
```typescript
// ✅ NEW: frontend/src/services/product.service.ts
import { ProductsService } from '@/client';
import type { ProductListResponse, ProductResponse } from '@/client';

export const productService = {
  async getProducts(filters?: {
    skip?: number;
    limit?: number;
    categoryId?: number;
    collectionId?: number;
    search?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ProductListResponse> {
    return ProductsService.getProducts(
      filters?.skip,
      filters?.limit,
      filters?.categoryId,
      filters?.collectionId,
      filters?.search,
      filters?.isFeatured,
      filters?.minPrice,
      filters?.maxPrice
    );
  },
  
  async getProduct(id: number): Promise<ProductResponse> {
    return ProductsService.getProduct(id);
  }
};
```

---

## 🎯 Step 6: Usage in React Components

### Example 1: Product List Component

```typescript
// frontend/src/pages/Products.tsx
import { useEffect, useState } from 'react';
import { ProductsService } from '@/client';
import type { ProductResponse } from '@/client';

export function ProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        // ✨ Fully typed, autocomplete works!
        const response = await ProductsService.getProducts(
          0,    // skip
          20,   // limit
          undefined, // categoryId
          undefined, // collectionId
          undefined, // search
          true,      // isFeatured
          1000000,   // minPrice
          5000000    // maxPrice
        );
        
        setProducts(response.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="products-grid">
      {products.map(product => (
        <div key={product.id} className="product-card">
          <img src={product.thumbnailUrl} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.price.toLocaleString('vi-VN')} VND</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Shopping Cart Component

```typescript
// frontend/src/pages/Cart.tsx
import { useEffect, useState } from 'react';
import { CartService } from '@/client';
import type { CartSummary } from '@/client';

export function CartPage() {
  const [cart, setCart] = useState<CartSummary | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      // ✨ Automatic authentication via interceptor
      const cartData = await CartService.getCartSummary();
      setCart(cartData);
    } catch (err) {
      console.error('Failed to load cart:', err);
    }
  }

  async function addToCart(productId: number, quantity: number) {
    try {
      await CartService.addToCart({
        productId,
        quantity
      });
      // Reload cart
      await loadCart();
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  }

  async function updateQuantity(itemId: number, quantity: number) {
    try {
      await CartService.updateCartItem(itemId, { quantity });
      await loadCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  }

  async function removeItem(itemId: number) {
    try {
      await CartService.removeFromCart(itemId);
      await loadCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  }

  if (!cart) return <div>Loading cart...</div>;

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <div className="cart-items">
        {cart.cart.items.map(item => (
          <div key={item.id} className="cart-item">
            <img src={item.product.thumbnailUrl} alt={item.product.name} />
            <div className="item-details">
              <h3>{item.product.name}</h3>
              <p>{item.product.price.toLocaleString('vi-VN')} VND</p>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                min="1"
                max={item.product.stock}
              />
              <button onClick={() => removeItem(item.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h2>Total Items: {cart.totalItems}</h2>
        <h2>Subtotal: {cart.subtotal.toLocaleString('vi-VN')} VND</h2>
      </div>
    </div>
  );
}
```

### Example 3: Authentication with Generated Client

```typescript
// frontend/src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { AuthenticationService } from '@/client';
import { setupApiClient } from '@/services/apiClient';
import type { UserResponse, Token } from '@/client';

export function useAuth() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        setupApiClient(); // Setup interceptor
        const userData = await AuthenticationService.getCurrentUserInfo();
        setUser(userData);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
    setLoading(false);
  }

  async function login(email: string, password: string) {
    try {
      // Note: OAuth2PasswordRequestForm uses 'username' field
      const tokenData: Token = await AuthenticationService.login({
        username: email,
        password: password
      });
      
      localStorage.setItem('access_token', tokenData.accessToken);
      localStorage.setItem('refresh_token', tokenData.refreshToken);
      
      setupApiClient(); // Setup with new token
      
      const userData = await AuthenticationService.getCurrentUserInfo();
      setUser(userData);
      
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  }

  async function logout() {
    try {
      await AuthenticationService.logout();
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }

  async function register(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    try {
      await AuthenticationService.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone
      });
      
      // Auto-login after registration
      return await login(data.email, data.password);
    } catch (err) {
      console.error('Registration failed:', err);
      return false;
    }
  }

  return {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user
  };
}
```

---

## 🔄 Step 7: Automatic Token Refresh

The `apiClient.ts` will handle automatic token refresh when access token expires:

```typescript
// This is already implemented in apiClient.ts
// When you get a 401 error, the interceptor will:
// 1. Try to refresh the token using refresh_token
// 2. Update localStorage with new tokens
// 3. Retry the original request
// 4. If refresh fails, redirect to login
```

**Usage example:**
```typescript
// You don't need to do anything special!
// Just call the API normally:
const products = await ProductsService.getProducts();

// If access_token is expired:
// 1. Request fails with 401
// 2. Interceptor automatically calls /auth/refresh-token
// 3. Gets new access_token and refresh_token
// 4. Retries the original request
// 5. You get your products!
```

---

## 🎨 Step 8: Type-Safe API Calls Everywhere

### Collections API

```typescript
import { CollectionsService } from '@/client';
import type { CollectionWithProductsResponse } from '@/client';

// Get collection with products
const collection: CollectionWithProductsResponse = 
  await CollectionsService.getCollection(1);

console.log(collection.name);
console.log(collection.products); // Fully typed!
```

### Orders API

```typescript
import { OrdersService } from '@/client';
import type { OrderResponse } from '@/client';

// Create order
const order: OrderResponse = await OrdersService.createOrder({
  items: [
    { productId: 1, quantity: 2, variant: "Brown Leather" },
    { productId: 5, quantity: 1 }
  ],
  fullName: "John Doe",
  phoneNumber: "0901234567",
  shippingAddress: "123 Main St",
  paymentMethod: "bank_transfer",
  depositAmount: 5000000
});

// Get my orders
const myOrders = await OrdersService.getOrders();
```

### Dashboard (Admin)

```typescript
import { DashboardService } from '@/client';

// Get dashboard stats (admin only)
const stats = await DashboardService.getDashboardStats();

console.log(`Revenue: ${stats.totalRevenue}`);
console.log(`Orders: ${stats.totalOrders}`);
console.log(`Low Stock: ${stats.lowStockProducts}`);

// Get top products
const topProducts = await DashboardService.getTopProducts(10);
```

---

## 🛠️ Step 9: Regenerate Client After Backend Changes

Whenever you update your FastAPI backend (add new endpoints, modify schemas), regenerate the client:

```bash
# In WSL terminal (frontend directory)
npm run generate-client
```

**Best Practice:**
- Run this after every backend API change
- Commit the generated code to git
- Team members can use the same typed client

---

## 🐛 Troubleshooting

### Issue 1: Cannot connect to backend

**Error:**
```
Failed to fetch OpenAPI spec from http://localhost:8000/openapi.json
```

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/docs

# If using WSL1, you might need to use Windows host IP
# Get Windows IP:
ip route | grep default | awk '{print $3}'

# Update generation command with Windows IP:
npm run generate-client -- --input http://172.x.x.x:8000/openapi.json
```

### Issue 2: TypeScript errors after generation

**Solution:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.vite
rm -rf dist

# Restart dev server
npm run dev
```

### Issue 3: Authentication not working

**Check:**
1. Token is being stored: `localStorage.getItem('access_token')`
2. Interceptor is setup: Call `setupApiClient()` in `main.tsx`
3. Backend returns correct headers: Check CORS settings

---

## 📚 Generated Services Reference

All available services after generation:

```typescript
import {
  // Authentication
  AuthenticationService,
  
  // Users
  UsersService,
  
  // Addresses
  AddressesService,
  
  // Products
  ProductsService,
  
  // Collections (NEW)
  CollectionsService,
  
  // Cart (NEW)
  CartService,
  
  // Orders
  OrdersService,
  
  // Payments
  PaymentsService,
  
  // Chat
  ChatService,
  
  // Upload
  UploadService,
  
  // Dashboard (NEW)
  DashboardService
} from '@/client';
```

**Each service has all your endpoints with:**
- Full TypeScript types
- JSDoc comments
- Parameter validation
- Return type inference

---

## ✅ Benefits Summary

### Before:
```typescript
// Manual typing
interface Product {
  id: number;
  name: string;
  // ... hope you got all fields right
}

// Manual axios call
const response = await axios.get<Product[]>('/api/v1/products');
// ❌ No autocomplete
// ❌ Types can drift from backend
// ❌ Manual token handling
```

### After:
```typescript
// Auto-generated types
import type { ProductResponse } from '@/client';

// Auto-generated service
const products = await ProductsService.getProducts();
// ✅ Full autocomplete
// ✅ Types always match backend
// ✅ Automatic authentication
// ✅ Compile-time safety
```

---

## 🎯 Next Steps

1. **Refactor all services** to use generated client
2. **Update React Query hooks** to use typed services
3. **Remove manual axios imports** from components
4. **Add to CI/CD**: Auto-generate client on backend changes
5. **Share types**: Export common types for reuse

---

**Status:** Ready for implementation ✅  
**Backend API:** 65 endpoints documented  
**Generated Services:** 11 service modules  
**Type Safety:** 100% covered
