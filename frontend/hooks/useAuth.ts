'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import type { Speaker, LoginRequest, RegisterRequest, AuthResponse } from '@/types/api';

export function useAuth() {
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<Speaker>('/speakers/me');
      setSpeaker(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    const response = await api.post<AuthResponse>('/login/', credentials);

    localStorage.setItem('token', response.data.access_token);
    await checkAuth();
    return response.data;
  };

  const register = async (data: RegisterRequest) => {
    await api.post('/speakers/register', data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setSpeaker(null);
    setIsAuthenticated(false);
    router.push('/');
  };

  return {
    speaker,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
  };
}
