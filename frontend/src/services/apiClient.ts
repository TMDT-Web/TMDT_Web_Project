/**
 * OpenAPI Generated Client Configuration
 * 
 * This file configures the auto-generated OpenAPI client with:
 * - Base URL from environment variables
 * - Automatic JWT token injection
 * - Token refresh on 401 errors
 * - Error handling
 */

import { OpenAPI } from '@/client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthenticationService } from '@/client';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// Track if we're currently refreshing to avoid duplicate requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribe to token refresh completion
 */
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers when token refresh completes
 */
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Attempt to refresh the access token
 */
async function refreshAccessToken(): Promise<string | null> {
  // Hỗ trợ cả 'refresh_token' và 'refreshToken'
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return null;
  }

  try {
    // Call refresh endpoint with correct parameter name
    const tokenData = await AuthenticationService.refreshTokenApiV1AuthRefreshTokenPost({
      requestBody: {
        refresh_token: refreshToken
      }
    });

    // Store new tokens (using snake_case from API)
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token);

    return tokenData.access_token;
  } catch (error) {
    // Refresh failed - clear tokens and redirect to login
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    window.location.href = '/login';
    return null;
  }
}

/**
 * Setup the OpenAPI client with configuration and interceptors
 */
export function setupApiClient() {
  // Configure base URL from environment variable with fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  OpenAPI.BASE = API_URL;

  // Debug log to verify API URL configuration
  console.log('🔌 API Base URL:', OpenAPI.BASE);

  // Configure token retrieval - must be async to match OpenAPI type
  OpenAPI.TOKEN = async () => {
    // Hỗ trợ cả 'token' và 'accessToken'
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem('accessToken');
    // Only log in development and avoid spamming console when not authenticated
    if (import.meta.env.DEV) {
      if (token) {
        console.log('✅ Token loaded');
      }
    }
    return token || undefined;
  };

  // Setup axios interceptors for the generated client
  // Note: The generated client uses axios internally
  // Use global axios so generated client picks up interceptors
  const axiosInstance = axios;

  // Request interceptor - inject JWT token
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle 401 and token refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, wait for it to complete
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await refreshAccessToken();

          if (newToken) {
            isRefreshing = false;
            onTokenRefreshed(newToken);

            // Retry original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          isRefreshing = false;
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  // Note: OpenAPI.request is readonly in the generated client
  // The TOKEN property we set above will handle authentication
  // Axios interceptors above will handle refresh logic for direct axios calls

  return axiosInstance;
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('token') || localStorage.getItem('accessToken');
}

/**
 * Get the current refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || localStorage.getItem('refreshToken');
}

/**
 * Set authentication tokens
 */
export function setTokens(accessToken: string, refreshToken: string) {
  // Lưu cả hai khóa để tương thích với mã hiện có
  localStorage.setItem('token', accessToken);
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Clear authentication tokens
 */
export function clearTokens() {
  localStorage.removeItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem('refreshToken');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// Initialize the client immediately and export the axios instance
export const apiClient = setupApiClient();

