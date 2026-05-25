'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const refreshTimerRef = useRef(null);

  // ── Silent token refresh ──────────────────────────────────────────────────
  const silentRefresh = async (refreshToken) => {
    if (!refreshToken) return null;
    try {
      const res = await fetch(`${API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      });
      const data = await res.json();
      if (data.success && data.accessToken) {
        localStorage.setItem('saas_token', data.accessToken);
        localStorage.setItem('saas_refresh', data.refreshToken);
        setToken(data.accessToken);
        // Schedule next refresh in 12 minutes (token expires in 15m)
        scheduleRefresh(data.refreshToken);
        return data.accessToken;
      }
    } catch (e) {
      console.warn('Silent refresh failed:', e.message);
    }
    return null;
  };

  const scheduleRefresh = (refreshToken) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Access token lives 15 minutes — refresh at 12 min mark
    refreshTimerRef.current = setTimeout(() => {
      silentRefresh(refreshToken);
    }, 12 * 60 * 1000);
  };

  // ── Bootstrap session from localStorage ──────────────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem('saas_token');
    const storedRefresh = localStorage.getItem('saas_refresh');
    const storedUser = localStorage.getItem('saas_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Always try a silent refresh on mount to get a fresh token
      if (storedRefresh) {
        silentRefresh(storedRefresh);
      }
    }
    setLoading(false);
  }, []);

  // ── Route protection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    const publicRoutes = ['/login', '/signup', '/'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!token && !isPublicRoute) {
      router.push('/login');
    } else if (token && (pathname === '/login' || pathname === '/signup')) {
      router.push('/dashboard');
    }
  }, [token, pathname, loading]);

  // ── Cleanup timer on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('saas_token', data.accessToken);
      localStorage.setItem('saas_refresh', data.refreshToken);
      localStorage.setItem('saas_user', JSON.stringify(data.user));

      setToken(data.accessToken);
      setUser(data.user);
      scheduleRefresh(data.refreshToken);
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (username, email, password, companyName) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, companyName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('saas_token', data.accessToken);
      localStorage.setItem('saas_refresh', data.refreshToken);
      localStorage.setItem('saas_user', JSON.stringify(data.user));

      setToken(data.accessToken);
      setUser(data.user);
      scheduleRefresh(data.refreshToken);
      router.push('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_refresh');
    localStorage.removeItem('saas_user');
    setToken(null);
    setUser(null);
    router.push('/');
  };

  const updateUserWorkspaces = (workspaces, activeId) => {
    if (!user) return;
    const updatedUser = { ...user, workspaces, activeWorkspace: activeId };
    setUser(updatedUser);
    localStorage.setItem('saas_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUserWorkspaces }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
