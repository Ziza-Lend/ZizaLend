import { Client } from '../client.js';
import { Auth } from '../auth.js';

function createMockClient() {
  const mockFetch = jest.fn();
  global.fetch = mockFetch;
  const client = new Client({ baseUrl: 'http://localhost:3001/api/v1' });
  return { client, mockFetch };
}

function mockJsonResponse(mockFetch: jest.Mock, data: unknown, status = 200) {
  mockFetch.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  });
}

describe('Auth', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── requestChallenge ────────────────────────────────────────────────────────

  describe('requestChallenge', () => {
    it('requests a challenge for a public key', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      mockJsonResponse(mockFetch, {
        success: true,
        data: {
          message: 'Sign this message to authenticate with Zizalend...',
          nonce: 'abc123',
          timestamp: 1700000000000,
          expiresIn: 300000,
        },
      });

      const challenge = await auth.requestChallenge('GABCDEF123');

      expect(challenge.message).toContain('Sign this message');
      expect(challenge.nonce).toBe('abc123');
      expect(challenge.timestamp).toBe(1700000000000);
      expect(challenge.expiresIn).toBe(300000);

      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/challenge');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body as string)).toEqual({ publicKey: 'GABCDEF123' });
    });

    it('throws ApiError on failure', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      mockJsonResponse(mockFetch, {
        success: false,
        error: { code: 'INVALID_PUBLIC_KEY', message: 'Invalid public key' },
      }, 400);

      await expect(auth.requestChallenge('bad-key')).rejects.toThrow('Invalid public key');
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('submits signed challenge and returns token', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      mockJsonResponse(mockFetch, {
        success: true,
        data: { token: 'jwt-token-123', publicKey: 'GABCDEF123' },
      });

      const result = await auth.login('GABCDEF123', 'message', 'base64sig==');

      expect(result.token).toBe('jwt-token-123');
      expect(result.publicKey).toBe('GABCDEF123');

      // Token should be set on the client
      expect(client.hasToken()).toBe(true);

      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/login');
      expect(JSON.parse(opts.body as string)).toEqual({
        publicKey: 'GABCDEF123',
        message: 'message',
        signature: 'base64sig==',
      });
    });

    it('sets token on client upon successful login', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      expect(client.hasToken()).toBe(false);

      mockJsonResponse(mockFetch, {
        success: true,
        data: { token: 'token-456', publicKey: 'GXYZ' },
      });

      await auth.login('GXYZ', 'msg', 'sig');
      expect(client.hasToken()).toBe(true);
    });
  });

  // ─── verify ──────────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('returns verify data on valid token', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      client.setToken('valid-token');

      mockJsonResponse(mockFetch, {
        success: true,
        data: { valid: true, publicKey: 'GABC', role: 'borrower', scopes: ['read:loans'] },
      });

      const result = await auth.verify();

      expect(result.valid).toBe(true);
      expect(result.publicKey).toBe('GABC');
      expect(result.role).toBe('borrower');

      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain('/auth/verify');
      expect(opts.method).toBe('GET');
    });

    it('returns valid: false for expired token', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      client.setToken('expired-token');

      mockJsonResponse(mockFetch, {
        success: true,
        data: { valid: false },
      });

      const result = await auth.verify();
      expect(result.valid).toBe(false);
    });
  });

  // ─── logout ──────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('clears token on successful logout', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      client.setToken('some-token');
      expect(client.hasToken()).toBe(true);

      mockJsonResponse(mockFetch, { success: true });

      await auth.logout();
      expect(client.hasToken()).toBe(false);
    });

    it('clears token even if logout request fails', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      client.setToken('some-token');
      mockFetch.mockRejectedValue(new Error('Network error'));

      await auth.logout();
      expect(client.hasToken()).toBe(false);
    });

    it('clears token even if server returns error', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      client.setToken('some-token');
      mockJsonResponse(mockFetch, {
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Expired' },
      }, 401);

      await auth.logout();
      expect(client.hasToken()).toBe(false);
    });
  });

  // ─── authenticate ────────────────────────────────────────────────────────────

  describe('authenticate', () => {
    it('performs full challenge-sign-login flow', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      // First call: challenge
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            message: 'Sign this: nonce=abc123',
            nonce: 'abc123',
            timestamp: 1700000000000,
            expiresIn: 300000,
          },
        }),
      });

      // Second call: login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { token: 'jwt-final', publicKey: 'GABCDEF123' },
        }),
      });

      const signer = jest.fn().mockResolvedValue('signed-base64');

      const result = await auth.authenticate('GABCDEF123', signer);

      expect(result.token).toBe('jwt-final');
      expect(client.hasToken()).toBe(true);
      expect(signer).toHaveBeenCalledWith('Sign this: nonce=abc123');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws if challenge fails', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'INVALID_PUBLIC_KEY', message: 'Bad key' },
        }),
      });

      const signer = jest.fn();
      await expect(auth.authenticate('bad-key', signer)).rejects.toThrow('Bad key');
      expect(signer).not.toHaveBeenCalled();
    });
  });

  // ─── isAuthenticated ─────────────────────────────────────────────────────────

  describe('isAuthenticated', () => {
    it('returns false when no token is set', () => {
      const { client } = createMockClient();
      const auth = new Auth(client);
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('returns true when a token is set', () => {
      const { client } = createMockClient();
      const auth = new Auth(client);
      client.setToken('token');
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('returns false after logout', async () => {
      const { client, mockFetch } = createMockClient();
      const auth = new Auth(client);
      client.setToken('token');
      mockJsonResponse(mockFetch, { success: true });
      await auth.logout();
      expect(auth.isAuthenticated()).toBe(false);
    });
  });
});
