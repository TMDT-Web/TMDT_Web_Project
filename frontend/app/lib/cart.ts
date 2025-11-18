// Cart API functions
import { getAccessToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

async function fetchWithAuth(endpoint: string, options?: RequestInit) {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API Error: ${response.statusText}`);
  }

  return response.json();
}

export async function getCartItems(): Promise<CartItem[]> {
  return fetchWithAuth("/cart");
}

export async function addToCart(data: AddToCartRequest): Promise<CartItem> {
  return fetchWithAuth("/cart", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCartItem(
  cartItemId: number,
  data: UpdateCartItemRequest
): Promise<CartItem> {
  return fetchWithAuth(`/cart/${cartItemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function removeCartItem(cartItemId: number): Promise<void> {
  return fetchWithAuth(`/cart/${cartItemId}`, {
    method: "DELETE",
  });
}

export async function clearCart(): Promise<void> {
  return fetchWithAuth("/cart", {
    method: "DELETE",
  });
}
