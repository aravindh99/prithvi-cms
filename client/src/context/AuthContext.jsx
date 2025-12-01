import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api.js';

const AuthContext = createContext();

const STORAGE_KEY = 'prithvi_auth_user';
const TOKEN_KEY = 'prithvi_auth_token';

// Load user from localStorage
const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user from localStorage:', error);
  }
  return null;
};

// Save user to localStorage
const saveUserToStorage = (user) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Load from localStorage immediately for instant UI
  const [user, setUser] = useState(() => loadUserFromStorage());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedUser = loadUserFromStorage();
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedUser || !storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser(storedUser);

    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      setUser(userData);
      saveUserToStorage(userData);
    } catch (error) {
      console.warn('Auth check failed, clearing auth state:', error);
      try {
        localStorage.removeItem(TOKEN_KEY);
        saveUserToStorage(null);
      } catch (e) {
        console.error('Error clearing auth storage:', e);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user: userData, token } = response.data;
      setUser(userData);
      saveUserToStorage(userData); // Persist to localStorage
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      saveUserToStorage(null); // Clear localStorage
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch (e) {
        console.error('Error clearing auth token:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

