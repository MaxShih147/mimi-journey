/**
 * Authentication hook for managing user authentication state.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api, ApiClientError } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types';

// Demo mode - bypass authentication for testing
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const DEMO_USER: User = {
  id: 'demo-user-123',
  email: 'demo@mimi-journey.app',
  name: 'Demo User',
  picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
};

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated, error, setUser, setLoading, setError, logout: clearAuth } = useAuthStore();

  // In demo mode, return mock user immediately
  const { data, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => {
      if (DEMO_MODE) {
        return Promise.resolve(DEMO_USER);
      }
      return api.getMe();
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update store when query completes
  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (queryError) {
      if (DEMO_MODE) {
        setUser(DEMO_USER);
      } else if (queryError instanceof ApiClientError && queryError.isUnauthorized) {
        setUser(null);
      } else {
        setError(queryError.message);
      }
    }
  }, [data, queryError, setUser, setError]);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => {
      if (DEMO_MODE) {
        return Promise.resolve();
      }
      return api.logout();
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
    },
    onError: () => {
      clearAuth();
      queryClient.clear();
    },
  });

  const login = () => {
    if (DEMO_MODE) {
      setUser(DEMO_USER);
      return;
    }
    window.location.href = api.getLoginUrl();
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: DEMO_MODE ? (data || DEMO_USER) : user,
    isLoading: DEMO_MODE ? false : queryLoading,
    isAuthenticated: DEMO_MODE ? true : !!data,
    error: queryError?.message || error,
    login,
    logout,
    isLoggingOut: logoutMutation.isPending,
    isDemoMode: DEMO_MODE,
  };
}
