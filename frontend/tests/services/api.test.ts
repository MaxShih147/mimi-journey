import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClientError } from '../../src/services/api';

describe('ApiClientError', () => {
  it('stores message, code, and status', () => {
    const error = new ApiClientError('Not found', 'NOT_FOUND', 404);
    expect(error.message).toBe('Not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.status).toBe(404);
    expect(error.name).toBe('ApiClientError');
  });

  it('stores details', () => {
    const error = new ApiClientError('Error', 'ERR', 400, { field: 'email' });
    expect(error.details).toEqual({ field: 'email' });
  });

  describe('isUnauthorized', () => {
    it('returns true for 401', () => {
      const error = new ApiClientError('Unauthorized', 'UNAUTHORIZED', 401);
      expect(error.isUnauthorized).toBe(true);
    });

    it('returns false for other status', () => {
      const error = new ApiClientError('Forbidden', 'FORBIDDEN', 403);
      expect(error.isUnauthorized).toBe(false);
    });
  });

  describe('isNotFound', () => {
    it('returns true for 404', () => {
      const error = new ApiClientError('Not found', 'NOT_FOUND', 404);
      expect(error.isNotFound).toBe(true);
    });

    it('returns false for other status', () => {
      const error = new ApiClientError('Error', 'ERR', 500);
      expect(error.isNotFound).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('returns true for 422', () => {
      const error = new ApiClientError('Invalid', 'VALIDATION_ERROR', 422);
      expect(error.isValidationError).toBe(true);
    });

    it('returns false for other status', () => {
      const error = new ApiClientError('Error', 'ERR', 400);
      expect(error.isValidationError).toBe(false);
    });
  });

  it('is an instance of Error', () => {
    const error = new ApiClientError('msg', 'code', 500);
    expect(error).toBeInstanceOf(Error);
  });
});

// Test the ApiClient request flow using fetch mocks
describe('ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getLoginUrl returns correct URL', async () => {
    // Import fresh to get module-level instance
    const { api } = await import('../../src/services/api');
    const url = api.getLoginUrl();
    expect(url).toContain('/auth/google/login');
  });

  it('getMe calls /auth/me', async () => {
    const mockUser = { id: '1', email: 'a@b.com', name: 'User' };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockUser),
    }));

    const { api } = await import('../../src/services/api');
    const user = await api.getMe();

    expect(user).toEqual(mockUser);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('throws ApiClientError on non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ code: 'UNAUTHORIZED', message: 'Auth required' }),
    }));

    const { api, ApiClientError } = await import('../../src/services/api');

    await expect(api.getMe()).rejects.toThrow(ApiClientError);
  });

  it('handles 204 No Content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject('Should not be called'),
    }));

    const { api } = await import('../../src/services/api');
    const result = await api.logout();
    expect(result).toBeUndefined();
  });
});
