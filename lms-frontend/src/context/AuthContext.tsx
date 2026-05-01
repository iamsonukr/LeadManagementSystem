'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, setAccessToken } from '@/services/apiClient';
import authService, { AuthUser } from '@/services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Bootstrap: try silent refresh on mount ──────────────────
  useEffect(() => {
    const bootstrap = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await authService.getMe();
        setUser(me);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  // ── Global logout event (fired by apiClient on 401 refresh fail)
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setAccessToken(null);
      router.replace('/login');
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [router]);

const login = useCallback(async (email: string, password: string) => {
  const { user: u, access_token: accessToken } =
    await authService.login({
      email,
      password,
    });

  setAccessToken(accessToken);
  setUser(u);

  router.replace('/dashboard');
}, [router]);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    setUser(null);
    setAccessToken(null);
    router.replace('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
