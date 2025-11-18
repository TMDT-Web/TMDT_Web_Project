// Authentication API functions
import { api } from "./api";
import { lsSet, lsGet, lsRemove } from "./safeLocalStorage";

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
  const res = await api.post<TokenPair>("/auth/login", credentials);
  return (res as any).data ?? res;
}

export async function register(data: RegisterRequest): Promise<User> {
  const res = await api.post<User>("/auth/register", data);
  return (res as any).data ?? res;
}

export async function refreshToken(refreshToken: string): Promise<TokenPair> {
  const res = await api.post<TokenPair>("/auth/refresh", {
    refresh_token: refreshToken,
  });
  return (res as any).data ?? res;
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
  lsSet("access_token", tokens.access_token);
  lsSet("refresh_token", tokens.refresh_token);
}

export function getAccessToken(): string | null {
  return lsGet("access_token");
}

export function getRefreshToken(): string | null {
  return lsGet("refresh_token");
}

export function clearTokens() {
  lsRemove("access_token");
  lsRemove("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
