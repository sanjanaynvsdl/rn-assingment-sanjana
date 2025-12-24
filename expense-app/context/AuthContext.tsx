import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await api.setToken(token);
        const { user } = await api.getMe();
        setUser(user);
      }
    } catch (error) {
      await api.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    await api.setToken(token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const { token, user } = await api.register(name, email, password);
    await api.setToken(token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = async () => {
    await api.clearToken();
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
