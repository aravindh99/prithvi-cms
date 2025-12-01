import axios from 'axios';

// API base URL:
// - If VITE_API_URL is set, use that.
// - Otherwise, use 192.168.1.171 for production and localhost:5000 in development.
const DEFAULT_API_URL = import.meta.env.PROD
  ? 'http://192.168.1.171:5000/api'
  : 'http://localhost:5000/api';

const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

// Base URL without `/api` suffix, useful for assets like /uploads/...
export const API_BASE_URL = API_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('prithvi_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';

      // On failed login, clear any stored credentials
      if (requestUrl.includes('/auth/login')) {
        try {
          localStorage.removeItem('prithvi_auth_user');
          localStorage.removeItem('prithvi_auth_token');
        } catch (e) {
          console.error('Error clearing auth storage:', e);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

