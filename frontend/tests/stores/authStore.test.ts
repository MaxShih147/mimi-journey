import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../../src/stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
    });
  });

  it('starts with loading state', () => {
    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBeNull();
  });

  describe('setUser', () => {
    it('sets user and marks authenticated', () => {
      const user = { id: '1', email: 'a@b.com', name: 'Test' };
      useAuthStore.getState().setUser(user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('clears auth when user is null', () => {
      // First set a user
      useAuthStore.getState().setUser({ id: '1', email: 'a@b.com', name: 'Test' });

      // Then clear
      useAuthStore.getState().setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setLoading', () => {
    it('updates loading state', () => {
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);

      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe('setError', () => {
    it('sets error and stops loading', () => {
      useAuthStore.getState().setError('Network error');

      const state = useAuthStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });

    it('clears error with null', () => {
      useAuthStore.getState().setError('Some error');
      useAuthStore.getState().setError(null);

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('logout', () => {
    it('resets all state', () => {
      // Set up authenticated state
      useAuthStore.getState().setUser({ id: '1', email: 'a@b.com', name: 'Test' });

      // Logout
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
