import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { lsGet } from "./safeLocalStorage";

// BASE_URL: giống backend /api
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Lấy token từ localStorage nếu có (đồng bộ với AuthContext)
try {
  const raw = lsGet("auth_tokens");
  if (raw) {
    const { access_token } = JSON.parse(raw) as { access_token: string };
    if (access_token) api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
  }
} catch {
  // ignore
}

// Bạn vẫn có thể export thêm helpers nếu cần
export type { AxiosRequestConfig, AxiosResponse };
