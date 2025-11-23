/**
 * TypeScript Type Definitions
 */

export interface User {
  id: number
  email: string
  full_name: string
  phone?: string
  address?: string
  is_active: boolean
  is_admin: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  slug: string
  description?: string
  image_url?: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: number
  product_id: number
  image_url: string
  alt_text?: string
  is_primary: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price: number
  original_price?: number
  discount_percent: number
  stock: number
  sku?: string
  dimensions?: string
  material?: string
  color?: string
  weight?: number
  category_id: number
  is_active: boolean
  is_featured: boolean
  views_count: number
  sales_count: number
  category: Category
  images: ProductImage[]
  created_at: string
  updated_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPING = 'shipping',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentGateway {
  COD = 'cod',
  MOMO = 'momo',
  VNPAY = 'vnpay',
  BANK_TRANSFER = 'bank_transfer',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum OrderPaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

export interface Order {
  id: number
  order_number: string
  status: OrderStatus
  payment_status: OrderPaymentStatus
  total_amount: number
  reward_points_used: number
  reward_points_earned: number
  voucher_code?: string
  shipping_address: string
  shipping_contact_name: string
  shipping_contact_phone: string
  notes?: string
  created_at: string
  updated_at: string
  items: OrderItem[]
}

export interface ChatMessage {
  id: number
  session_id: number
  sender: 'user' | 'admin' | 'system'
  sender_id?: number
  message: string
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: number
  user_id: number
  session_id: string
  status: 'active' | 'closed' | 'waiting'
  admin_id?: number
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}
