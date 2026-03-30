import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, profileApi, getStoredUser, clearToken, setStoredUser, UserProfile } from '../lib/api';

export type { UserProfile };

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthChecked: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await profileApi.get();
      if (res.success && res.data) {
        setUser(res.data);
        setStoredUser(res.data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // On mount, refresh profile if token exists
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('kp_access_token');
      if (token) {
        await refreshProfile();
      }
      setIsAuthChecked(true);
    };
    initAuth();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (!res.success) throw new Error(res.error || '登录失败');
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(email, password, name);
      if (!res.success) throw new Error(res.error || '注册失败');
      setUser(res.data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authApi.logout();
    clearToken();
    setUser(null);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      setStoredUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthChecked,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
