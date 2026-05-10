import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 — attempt silent token refresh before logging out
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const code = (error.response?.data as { code?: string } | undefined)?.code;

    // Only attempt refresh on token expiry (not on MISSING_TOKEN / INVALID_TOKEN)
    const isExpired = error.response?.status === 401 && code === 'TOKEN_EXPIRED';

    if (isExpired && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (refreshToken) {
        try {
          // Use a plain axios instance to avoid interceptor loops
          const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = data.data;
          // setTokens writes to Zustand AND updates the cookie
          setTokens(newAccess, newRefresh);
          originalRequest.headers!['Authorization'] = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch {
          // Refresh failed — full logout
          logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/login?reason=session_expired';
          }
          return Promise.reject(error);
        }
      }
    }

    // Any other 401 — clear session
    if (error.response?.status === 401 && !originalRequest._retry) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Typed API helpers
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
  logoutAll: () =>
    api.post('/auth/logout-all'),
  me: () => api.get('/auth/me'),
  updateMe: (data: { name?: string; currentPassword?: string; newPassword?: string }) =>
    api.patch('/auth/me', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

export const usersApi = {
  list: (params?: Record<string, string>) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: unknown) => api.post('/users', data),
  update: (id: string, data: unknown) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const productsApi = {
  list: (params?: Record<string, string>) => api.get('/products', { params }),
  stats: () => api.get('/products/stats'),
  categories: () => api.get('/products/categories'),
  get: (id: string) => api.get(`/products/${id}`),
  stockLogs: (id: string) => api.get(`/products/${id}/stock-logs`),
  create: (data: unknown) => api.post('/products', data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data),
  adjustStock: (id: string, data: { adjustment?: number; setTo?: number; reason?: string }) =>
    api.patch(`/products/${id}/stock`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const salesApi = {
  list: (params?: Record<string, string>) => api.get('/sales', { params }),
  get: (id: string) => api.get(`/sales/${id}`),
  invoice: (id: string) => api.get(`/sales/${id}/invoice`),
  create: (data: unknown) => api.post('/sales', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/sales/${id}/status`, { status }),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  salesChart: (period: 'daily' | 'weekly' | 'monthly') =>
    api.get('/analytics/sales-chart', { params: { period } }),
  topProducts: (limit?: number) =>
    api.get('/analytics/top-products', { params: { limit } }),
};

export const storesApi = {
  list: () => api.get('/stores'),
  get: (id: string) => api.get(`/stores/${id}`),
  create: (data: unknown) => api.post('/stores', data),
  update: (id: string, data: unknown) => api.put(`/stores/${id}`, data),
  delete: (id: string) => api.delete(`/stores/${id}`),
};

export const aiApi = {
  status: () => api.get('/ai/status'),
  forecast: () => api.get('/ai/forecast'),
  insights: () => api.get('/ai/insights'),
  restock: () => api.get('/ai/restock'),
  behavior: () => api.get('/ai/behavior'),
};
