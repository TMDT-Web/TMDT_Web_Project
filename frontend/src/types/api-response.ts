/**
 * API Response Types
 */

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  detail?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

export interface ErrorResponse {
  detail: string
  message?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}
