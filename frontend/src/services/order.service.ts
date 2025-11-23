/**
 * Order Service
 */
import api from './api'
import { Order, PaymentGateway } from '@/types'

export interface CreateOrderData {
  shipping_address: string
  shipping_contact_name: string
  shipping_contact_phone: string
  notes?: string
  payment_gateway: PaymentGateway
  voucher_code?: string
  use_reward_points?: boolean
}

export interface CreateOrderResponse {
  order: Order
  payment?: {
    payment_url?: string
    qr_code_url?: string
    [key: string]: any
  }
}

export interface OrderListResponse {
  items: Order[]
  total: number
  page: number
  size: number
}

export const orderService = {
  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const response = await api.post<CreateOrderResponse>('/orders', data)
    return response.data
  },

  async getMyOrders(page = 1, size = 10): Promise<OrderListResponse> {
    const response = await api.get<OrderListResponse>(
      '/orders',
      { params: { page, size } }
    )
    return response.data
  },

  async getOrder(id: number): Promise<Order> {
    const response = await api.get<Order>(`/orders/${id}`)
    return response.data
  },

  async cancelOrder(id: number): Promise<Order> {
    const response = await api.post<Order>(`/orders/${id}/cancel`)
    return response.data
  },

  // Admin methods
  async getAllOrders(page = 1, size = 10): Promise<OrderListResponse> {
    const response = await api.get<OrderListResponse>(
      '/orders/admin',
      { params: { page, size } }
    )
    return response.data
  },

  async updateOrderStatus(id: number, status: string, notes?: string): Promise<Order> {
    const response = await api.patch<Order>(`/orders/${id}/status`, { status, notes })
    return response.data
  },
}
