import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { apiRequest } from '../api/client';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('newtonite_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('newtonite_token')) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      const res = await apiRequest('/auth/me');
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Failed to restore session:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password = 'password123') => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      localStorage.setItem('newtonite_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const switchUser = async (email: string) => {
    await login(email, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('newtonite_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
