import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('cloudops_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cloudops_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('cloudops_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('cloudops_token', res.token);
      localStorage.setItem('cloudops_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, role) => {
    const res = await authService.register(name, email, password, role);
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('cloudops_token', res.token);
      localStorage.setItem('cloudops_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const switchDemoAccount = async (email) => {
    return login(email, 'cloudops123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cloudops_token');
    localStorage.removeItem('cloudops_user');
  };

  const role = user?.role || 'VIEWER';
  const isAdmin = role === 'ADMIN';
  const isOperator = role === 'OPERATOR';
  const isViewer = role === 'VIEWER';

  // Specific permission capabilities
  const canScale = isAdmin || isOperator;
  const canModifyResources = isAdmin || isOperator;
  const canManagePolicies = isAdmin;

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role,
    isAdmin,
    isOperator,
    isViewer,
    canScale,
    canModifyResources,
    canManagePolicies,
    login,
    register,
    logout,
    switchDemoAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
