// Authentication API functions
import { api } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function login(credentials: LoginRequest): Promise<TokenPair> {
  return api.post<TokenPair>("/auth/login", credentials);
}

export async function register(data: RegisterRequest): Promise<User> {
  return api.post<User>("/auth/register", data);
}

export async function refreshToken(refreshToken: string): Promise<TokenPair> {
  return api.post<TokenPair>("/auth/refresh", {
    refresh_token: refreshToken,
  });
}

export async function getCurrentUser(token: string): Promise<User> {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get current user");
  }

  return response.json();
}

export async function updateCurrentUser(
  token: string,
  data: Partial<User>
): Promise<User> {
  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update user");
  }

  return response.json();
}

// Token management utilities
export function saveTokens(tokens: TokenPair) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
