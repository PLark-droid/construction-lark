/**
 * Tests for LarkAuth module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LarkAuth } from '../lark-auth.js';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

// Mock fetch
global.fetch = vi.fn();

describe('LarkAuth', () => {
  const mockConfig = {
    appId: 'test_app_id',
    appSecret: 'test_app_secret',
    credentialsPath: '/tmp/test-credentials.json',
  };

  const mockTokenResponse = {
    code: 0,
    msg: 'success',
    app_access_token: 'mock_access_token_123',
    expire: 7200, // 2 hours
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup test credentials file
    if (existsSync(mockConfig.credentialsPath)) {
      await unlink(mockConfig.credentialsPath);
    }
  });

  describe('constructor', () => {
    it('should create instance with default values', () => {
      const auth = new LarkAuth({
        appId: mockConfig.appId,
        appSecret: mockConfig.appSecret,
      });

      expect(auth).toBeInstanceOf(LarkAuth);
      expect(auth.getCredentialsPath()).toContain('.construction-lark/credentials.json');
    });

    it('should create instance with custom credentials path', () => {
      const auth = new LarkAuth(mockConfig);

      expect(auth.getCredentialsPath()).toBe(mockConfig.credentialsPath);
    });
  });

  describe('authenticate', () => {
    it('should successfully authenticate and save credentials', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      const token = await auth.authenticate();

      expect(token).toBe(mockTokenResponse.app_access_token);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/v3/app_access_token/internal'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app_id: mockConfig.appId,
            app_secret: mockConfig.appSecret,
          }),
        })
      );

      // Verify credentials were saved
      const credentials = auth.getCredentials();
      expect(credentials).not.toBeNull();
      expect(credentials?.accessToken).toBe(mockTokenResponse.app_access_token);
      expect(credentials?.appId).toBe(mockConfig.appId);
    });

    it('should throw error on HTTP failure', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(auth.authenticate()).rejects.toThrow('HTTP 500');
    });

    it('should throw error on Lark API error', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 99991663,
          msg: 'app_access_token is invalid',
        }),
      });

      await expect(auth.authenticate()).rejects.toThrow('Lark API error');
    });
  });

  describe('getAccessToken', () => {
    it('should return cached token if valid', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      // First call - authenticate
      const token1 = await auth.getAccessToken();

      // Second call - should use cached token
      const token2 = await auth.getAccessToken();

      expect(token1).toBe(token2);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should refresh token if expired', async () => {
      const auth = new LarkAuth(mockConfig);

      // First token (will expire immediately)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTokenResponse,
          expire: 0, // Expires immediately
        }),
      });

      await auth.authenticate();

      // Second token (new)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTokenResponse,
          app_access_token: 'new_token_456',
        }),
      });

      // Should request new token
      const token = await auth.getAccessToken();

      expect(token).toBe('new_token_456');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', async () => {
      const auth = new LarkAuth(mockConfig);

      const isAuth = await auth.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('should return true when authenticated with valid token', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await auth.authenticate();

      const isAuth = await auth.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false when token is expired', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTokenResponse,
          expire: 0, // Expires immediately
        }),
      });

      await auth.authenticate();

      // Wait a bit to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 10));

      const isAuth = await auth.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should force a new token request', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await auth.authenticate();

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTokenResponse,
          app_access_token: 'refreshed_token_789',
        }),
      });

      const newToken = await auth.refreshToken();

      expect(newToken).toBe('refreshed_token_789');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCredentials', () => {
    it('should clear in-memory and file-based credentials', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await auth.authenticate();

      expect(auth.getCredentials()).not.toBeNull();
      expect(existsSync(mockConfig.credentialsPath)).toBe(true);

      await auth.clearCredentials();

      expect(auth.getCredentials()).toBeNull();
      expect(existsSync(mockConfig.credentialsPath)).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist credentials to file system', async () => {
      const auth = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await auth.authenticate();

      // Create new instance and load from file
      const auth2 = new LarkAuth(mockConfig);
      const token = await auth2.getAccessToken();

      expect(token).toBe(mockTokenResponse.app_access_token);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only first auth called fetch
    });

    it('should ignore credentials from different app', async () => {
      const auth1 = new LarkAuth(mockConfig);

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      });

      await auth1.authenticate();

      // Create instance with different app ID
      const auth2 = new LarkAuth({
        ...mockConfig,
        appId: 'different_app_id',
      });

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockTokenResponse,
          app_access_token: 'different_app_token',
        }),
      });

      const token = await auth2.getAccessToken();

      expect(token).toBe('different_app_token');
      expect(global.fetch).toHaveBeenCalledTimes(2); // Both apps called fetch
    });
  });
});
