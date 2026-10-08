import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('finsight_user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('finsight_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('finsight_user', JSON.stringify(res.data));
        } catch (err) {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('finsight_token');
          localStorage.removeItem('finsight_user');
        }
      }
      setLoading(false);
    };

    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('finsight_token', access_token);
    localStorage.setItem('finsight_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { access_token, user: newUser } = res.data;
    setToken(access_token);
    setUser(newUser);
    localStorage.setItem('finsight_token', access_token);
    localStorage.setItem('finsight_user', JSON.stringify(newUser));
    return newUser;
  };

  const demoLogin = async () => {
    try {
      return await login('alex.reynolds@example.com', 'password123');
    } catch (err) {
      // Fallback if backend server is not running during standalone frontend preview
      const fallbackUser = {
        id: 1,
        full_name: 'Alex Reynolds',
        email: 'alex.reynolds@example.com',
        role: 'admin',
        currency: 'USD'
      };
      setUser(fallbackUser);
      setToken('mock-jwt-demo-token');
      localStorage.setItem('finsight_user', JSON.stringify(fallbackUser));
      localStorage.setItem('finsight_token', 'mock-jwt-demo-token');
      return fallbackUser;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('finsight_token');
    localStorage.removeItem('finsight_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        demoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
