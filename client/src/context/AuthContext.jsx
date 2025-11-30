import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api.js';

const AuthContext = createContext();

const STORAGE_KEY = 'prithvi_auth_user';

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
    // Trust localStorage - no server validation needed
    // Just verify user exists in localStorage
    const storedUser = loadUserFromStorage();
    if (storedUser) {
      setUser(storedUser);
      // Optionally verify with server (but don't fail if it fails)
      try {
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        setUser(userData);
        saveUserToStorage(userData); // Update localStorage with fresh data
      } catch (error) {
        // Server validation failed, but keep using localStorage
        console.warn('Server auth check failed, using localStorage:', error);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const userData = response.data.user;
      setUser(userData);
      saveUserToStorage(userData); // Persist to localStorage
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
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

