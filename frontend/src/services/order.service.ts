/**
 * Order Service
 */
import api from './api'
import { Order, PaymentGateway } from '@/types'

export interface OrderItemCreate {
  product_id: number
  quantity: number
  variant?: string
}

export interface CreateOrderData {
  full_name: string
  phone_number: string
  shipping_address: string
  note?: string
  payment_method: string
  items: OrderItemCreate[]
}

export interface CreateOrderResponse {
  // Backend returns OrderResponse directly, not wrapped in {order: ...}
  id: number
  user_id: number
  full_name: string
  phone_number: string
  shipping_address: string
  note?: string
  payment_method: string
  subtotal: number
  shipping_fee: number
  discount_amount: number
  total_amount: number
  deposit_amount: number
  remaining_amount: number
  is_paid: boolean
  status: string
  cancellation_reason?: string
  items: any[]
  created_at: string
  updated_at: string
  // Payment info (if applicable)
  payment?: {
    payment_url?: string
    qr_code_url?: string
    [key: string]: any
  }
}

export interface OrderListResponse {
  orders: Order[]
  total: number
}

export const orderService = {
  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const response = await api.post<CreateOrderResponse>('/api/v1/orders', data)
    return response.data
  },

  async getMyOrders(page = 1, size = 10): Promise<OrderListResponse> {
    const skip = (page - 1) * size
    const response = await api.get<OrderListResponse>(
      '/api/v1/orders/my-orders',
      { params: { skip, limit: size } }
    )
    return response.data
  },

  async getOrder(id: number): Promise<Order> {
    const response = await api.get<Order>(`/api/v1/orders/${id}`)
    return response.data
  },

  async cancelOrder(id: number): Promise<Order> {
    const response = await api.post<Order>(`/api/v1/orders/${id}/cancel`)
    return response.data
  },

  // Admin methods
  async getAllOrders(page = 1, size = 10): Promise<OrderListResponse> {
    const skip = (page - 1) * size
    const response = await api.get<OrderListResponse>(
      '/api/v1/orders',
      { params: { skip, limit: size } }
    )
    return response.data
  },

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<Order> {
    const response = await api.put<Order>(`/api/v1/orders/${id}`, { status })
    return response.data
  },
}
