import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { lsGet } from "./safeLocalStorage";

// BASE_URL: giống backend /api
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor: Lấy token mới từ localStorage trước mỗi request
api.interceptors.request.use(
  (config) => {
    try {
      // AuthContext lưu token vào "fs_access_token"
      const token = lsGet("fs_access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Bạn vẫn có thể export thêm helpers nếu cần
export type { AxiosRequestConfig, AxiosResponse };
