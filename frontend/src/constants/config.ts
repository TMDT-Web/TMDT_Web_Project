/**
 * Configuration Constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'LuxeFurniture'

export const PAGINATION_LIMIT = 20

export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  PROFILE: '/profile',
  LOGIN: '/login',
  REGISTER: '/register',
  ADMIN: {
    DASHBOARD: '/admin',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    USERS: '/admin/users',
    CHAT: '/admin/chat',
  },
} as const

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'luxe_auth_token',
  REFRESH_TOKEN: 'luxe_refresh_token',
  CART: 'luxe_cart',
  USER: 'luxe_user',
} as const
