'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getErrorMessage, getStoredToken, setStoredToken, setUnauthorizedHandler } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import * as authService from '@/services/auth.service';
import type { LoginValues, RegisterValues } from '@/schemas';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (values: LoginValues) => Promise<void>;
  register: (values: RegisterValues) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasToken = typeof window !== 'undefined' && Boolean(getStoredToken());

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: authService.getMe,
    enabled: hasToken,
    retry: false,
    staleTime: 30_000,
  });

  const handleUnauthorized = useCallback(() => {
    setStoredToken(null);
    queryClient.setQueryData(queryKeys.me, null);
    queryClient.clear();
    router.replace('/login');
  }, [queryClient, router]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const { mutateAsync: loginAsync } = useMutation({ mutationFn: authService.login });
  const { mutateAsync: registerAsync } = useMutation({ mutationFn: authService.register });
  const { mutateAsync: logoutAsync } = useMutation({ mutationFn: authService.logout });

  const login = useCallback(
    async (values: LoginValues) => {
      try {
        const user = await loginAsync(values);
        queryClient.setQueryData(queryKeys.me, user);
        toast.success('Welcome back');
        router.replace('/projects');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Login failed'));
        throw error;
      }
    },
    [loginAsync, queryClient, router],
  );

  const register = useCallback(
    async (values: RegisterValues) => {
      try {
        const user = await registerAsync(values);
        queryClient.setQueryData(queryKeys.me, user);
        toast.success('Account created');
        router.replace('/projects');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Registration failed'));
        throw error;
      }
    },
    [registerAsync, queryClient, router],
  );

  const logout = useCallback(async () => {
    try {
      await logoutAsync();
      queryClient.setQueryData(queryKeys.me, null);
      queryClient.clear();
      toast.success('Logged out');
      router.replace('/login');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Logout failed'));
    }
  }, [logoutAsync, queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.isError ? null : meQuery.data,
      isLoading: hasToken ? meQuery.isLoading : false,
      isAuthenticated: Boolean(meQuery.data) && !meQuery.isError,
      login,
      register,
      logout,
      refetchUser: meQuery.refetch,
    }),
    [
      hasToken,
      meQuery.data,
      meQuery.isError,
      meQuery.isLoading,
      meQuery.refetch,
      login,
      register,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
