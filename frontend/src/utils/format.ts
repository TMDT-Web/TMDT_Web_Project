import { API_URL } from '@/constants/config'

/**
 * Format image URL to use backend API host for relative paths
 */
export const formatImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return ''
  
  // If already an absolute URL (http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  // If relative path (starts with /), prepend API_URL
  if (imageUrl.startsWith('/')) {
    return `${API_URL}${imageUrl}`
  }
  
  // Otherwise, treat as relative and prepend API_URL with /
  return `${API_URL}/${imageUrl}`
}

/**
 * Format currency to VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

/**
 * Format date
 */
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format short date
 */
export const formatShortDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

/**
 * Truncate text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Calculate discount price
 */
export const calculateDiscountPrice = (
  originalPrice: number,
  discountPercent: number
): number => {
  return originalPrice * (1 - discountPercent / 100)
}

/**
 * Format price - alias for formatCurrency with shorter display
 */
export const formatPrice = (amount: number): string => {
  // Format to millions VND for readability (e.g., "45,000,000 đ")
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
}
