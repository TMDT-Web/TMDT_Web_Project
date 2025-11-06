# Backend API Endpoints Documentation

Base URL: `http://localhost:8000/api`

## Authentication & Users

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user (returns access + refresh token)
- `POST /auth/refresh` - Refresh access token
- `GET /auth/google/login` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback

### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update current user profile
- `GET /users` - List all users (Admin only)
- `GET /users/{user_id}` - Get user by ID (Admin only)
- `PATCH /users/{user_id}` - Update user by ID (Admin only)

### User Addresses
- `POST /users/me/addresses` - Create new address for current user
- `GET /users/me/addresses` - Get all addresses of current user (not in postman but likely exists)
- `PATCH /users/me/addresses/{address_id}` - Update address (not in postman but likely exists)
- `DELETE /users/me/addresses/{address_id}` - Delete address (not in postman but likely exists)

### Roles
- `GET /roles` - List all roles
- `POST /roles` - Create new role (Admin only)

## Products

### Products
- `GET /products` - List all products (with filters: q, category_id, min_price, max_price, page, size, tag_ids)
- `GET /products/{product_id}` - Get product by ID
- `GET /products/suggestions` - Get product suggestions (requires q parameter)
- `POST /products` - Create new product (Admin only)
- `PATCH /products/{product_id}` - Update product (Admin only)
- `DELETE /products/{product_id}` - Delete product (Admin only)

### Categories
- `GET /products/categories` - List all categories (**NOT /categories**)
- `POST /products/categories` - Create new category (Admin only)

### Tags
- `GET /products/tags` - List all tags (**NOT /tags**)
- `POST /products/tags` - Create new tag (Admin only)

## Cart

- `GET /cart` - Get current user's cart items
- `POST /cart` - Add item to cart
- `PATCH /cart/{cart_item_id}` - Update cart item quantity
- `DELETE /cart/{cart_item_id}` - Remove item from cart
- `DELETE /cart` - Clear all cart items

## Orders

### Customer Orders
- `POST /orders` - Create new order from cart
- `GET /orders` - List current user's orders
- `GET /orders/{order_id}` - Get order details
- `POST /orders/{order_id}/cancel` - Cancel order

### Admin Orders
- `GET /admin/orders` - List all orders (Admin only)
- `PATCH /admin/orders/{order_id}/status` - Update order status (Admin only)

## Payments

- `POST /payments/initiate` - Initiate payment for an order
- `GET /payments/{payment_gateway}/callback` - Payment gateway callback
- `GET /payments/{payment_gateway}/webhook` - Payment gateway webhook (not in collection)

## Rewards

- `GET /rewards/me` - Get current user's rewards dashboard
- `POST /rewards/redeem` - Redeem a voucher

## Inventory

- `GET /inventory` - Get inventory for all products (Admin only)
- `GET /inventory/{product_id}` - Get inventory for specific product
- `PATCH /inventory/{product_id}` - Update inventory (Admin only)

---

## Request/Response Examples

### Get Products
```
GET /products?q=chair&category_id=1&min_price=100&max_price=1000&page=1&size=10
```

### Login
```json
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer"
}
```

### Add to Cart
```json
POST /cart
Headers: Authorization: Bearer {access_token}
{
  "product_id": 1,
  "quantity": 2
}
```

### Create Order
```json
POST /orders
Headers: Authorization: Bearer {access_token}
{
  "address_id": 1,
  "payment_method": "CREDIT_CARD"
}
```

---

## Important Notes

1. **All endpoints are prefixed with `/api`** (configured in backend settings)
2. **Categories endpoint is `/products/categories`**, NOT `/categories`
3. **Tags endpoint is `/products/tags`**, NOT `/tags`
4. **Protected routes require `Authorization: Bearer {access_token}` header**
5. **Admin-only routes require user to have admin role**
6. **Cart and Orders operations require authentication**
