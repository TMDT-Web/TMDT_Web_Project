// Orders API functions
import { getAccessToken } from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  payment_method: string;
  shipping_address_id: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image_url?: string;
  };
}

export interface CreateOrderRequest {
  address_id: number;
  payment_method: string;
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

export async function getOrders(): Promise<Order[]> {
  return fetchWithAuth("/orders");
}

export async function getOrder(orderId: number): Promise<Order> {
  return fetchWithAuth(`/orders/${orderId}`);
}

export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  return fetchWithAuth("/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function cancelOrder(orderId: number): Promise<Order> {
  return fetchWithAuth(`/orders/${orderId}/cancel`, {
    method: "POST",
  });
}
