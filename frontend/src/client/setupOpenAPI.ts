import { OpenAPI } from '@/client/core/OpenAPI'

// Initialize OpenAPI client base URL and auth token resolver
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'

OpenAPI.BASE = API_BASE
OpenAPI.TOKEN = async () => {
  try {
    // Hỗ trợ cả hai khóa: 'token' và 'accessToken'
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
    return token || ''
  } catch {
    return ''
  }
}

// Optional: attach extra headers if needed
OpenAPI.HEADERS = async () => ({
  'X-Requested-With': 'XMLHttpRequest'
})

export {}