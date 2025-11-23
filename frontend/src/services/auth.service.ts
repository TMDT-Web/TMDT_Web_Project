/**
 * Authentication Service - Using Generated OpenAPI Client
 */
import { AuthenticationService } from '@/client'
import type { Token, UserResponse, RegisterRequest } from '@/client'

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  phone?: string
}

export const authService = {
  /**
   * Login with email and password
   * Returns token response and saves to localStorage key 'token'
   */
  async login(data: LoginData): Promise<Token> {
    // Use generated client - OAuth2 expects 'username' field
    const response = await AuthenticationService.loginApiV1AuthLoginPost({
      username: data.email,
      password: data.password,
    })
    
    // ✅ CRUCIAL: Save token to localStorage with key 'token' (not 'access_token')
    // This matches the apiClient.ts configuration
    localStorage.setItem('token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
    
    return response
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<UserResponse> {
    const registerRequest: RegisterRequest = {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      phone: data.phone || null,
    }
    
    const response = await AuthenticationService.registerApiV1AuthRegisterPost(registerRequest)
    return response
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await AuthenticationService.getCurrentUserInfoApiV1AuthMeGet()
    return response
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await AuthenticationService.logoutApiV1AuthLogoutPost()
    } finally {
      // Always clear tokens from localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refresh_token')
    }
  },
}
