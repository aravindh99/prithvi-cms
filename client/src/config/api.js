import axios from 'axios';

// In production, API is on same domain, in dev use localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add user info from localStorage to headers
api.interceptors.request.use(
  (config) => {
    // Get user from localStorage and add to headers
    try {
      const userStr = localStorage.getItem('prithvi_auth_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          config.headers['x-user-id'] = user.id.toString();
          config.headers['x-user-role'] = user.role || '';
        }
      }
    } catch (error) {
      console.error('Error reading user from localStorage:', error);
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
    // Trust localStorage - only clear on explicit login failures
    // Don't auto-logout on 401 errors since we're trusting localStorage
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      
      // Only clear localStorage on login failure (not on /auth/me or other endpoints)
      if (requestUrl.includes('/auth/login')) {
        // Login failed - clear localStorage
        try {
          localStorage.removeItem('prithvi_auth_user');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }
      // For all other 401 errors, don't clear localStorage - trust localStorage
      // Let the component handle the error
    }
    return Promise.reject(error);
  }
);

export default api;

