import { ApiError, Client } from '../client.js';

// ─── ApiError ─────────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('creates an error with status code and message', () => {
    const err = new ApiError('Not found', 404, 'NOT_FOUND');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.errorCode).toBe('NOT_FOUND');
  });

  it('isAuthError returns true for 401', () => {
    expect(new ApiError('', 401).isAuthError).toBe(true);
    expect(new ApiError('', 403).isAuthError).toBe(false);
  });

  it('isRateLimited returns true for 429', () => {
    expect(new ApiError('', 429).isRateLimited).toBe(true);
    expect(new ApiError('', 503).isRateLimited).toBe(false);
  });

  it('isNotFound returns true for 404', () => {
    expect(new ApiError('', 404).isNotFound).toBe(true);
    expect(new ApiError('', 400).isNotFound).toBe(false);
  });

  it('isValidationError returns true for 400 + VALIDATION_ERROR', () => {
    expect(new ApiError('', 400, 'VALIDATION_ERROR').isValidationError).toBe(true);
    expect(new ApiError('', 400, 'INVALID_AMOUNT').isValidationError).toBe(false);
    expect(new ApiError('', 500).isValidationError).toBe(false);
  });

  it('stores optional field and details', () => {
    const details = { min: 0, max: 100 };
    const err = new ApiError('Invalid amount', 400, 'INVALID_AMOUNT', 'amount', details);
    expect(err.field).toBe('amount');
    expect(err.details).toEqual(details);
  });
});

// ─── Client Construction ─────────────────────────────────────────────────────

describe('Client', () => {
  describe('constructor', () => {
    it('normalizes baseUrl by stripping trailing slash', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001/api/v1/' });
      expect(client.getBaseUrl()).toBe('http://localhost:3001/api/v1');
    });

    it('applies defaults for timeout and maxRetries', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      expect(client['config'].timeoutMs).toBe(60000);
      expect(client['config'].maxRetries).toBe(3);
    });

    it('accepts custom timeout and maxRetries', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001', timeoutMs: 5000, maxRetries: 0 });
      expect(client['config'].timeoutMs).toBe(5000);
      expect(client['config'].maxRetries).toBe(0);
    });
  });

  // ─── Auth Token Management ──────────────────────────────────────────────────

  describe('token management', () => {
    it('starts without a token', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      expect(client.hasToken()).toBe(false);
    });

    it('setToken stores a token', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      client.setToken('my-jwt');
      expect(client.hasToken()).toBe(true);
    });

    it('setToken(undefined) clears the token', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001', token: 'initial' });
      expect(client.hasToken()).toBe(true);
      client.setToken(undefined);
      expect(client.hasToken()).toBe(false);
    });
  });

  // ─── API Key Management ─────────────────────────────────────────────────────

  describe('API key management', () => {
    it('starts without API key', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      expect(client.hasApiKey()).toBe(false);
    });

    it('setApiKey stores and clears the key', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      expect(client.hasApiKey()).toBe(false);
      client.setApiKey('sk-test');
      expect(client.hasApiKey()).toBe(true);
      client.setApiKey(undefined);
      expect(client.hasApiKey()).toBe(false);
    });
  });

  // ─── URL Building ───────────────────────────────────────────────────────────

  describe('buildUrl', () => {
    it('builds a simple path', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001/api/v1' });
      const url = client['buildUrl']('/health');
      expect(url).toBe('http://localhost:3001/api/v1/health');
    });

    it('appends query parameters', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001/api/v1' });
      const url = client['buildUrl']('/loans', { limit: 20, status: 'active' });
      expect(url).toBe('http://localhost:3001/api/v1/loans?limit=20&status=active');
    });

    it('skips undefined query parameters', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      const url = client['buildUrl']('/score/user123', { limit: undefined, cursor: undefined });
      expect(url).toBe('http://localhost:3001/score/user123');
    });

    it('handles boolean query parameters', () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      const url = client['buildUrl']('/test', { flag: true });
      expect(url).toBe('http://localhost:3001/test?flag=true');
    });
  });

  // ─── executeFetch (headers, auth) ───────────────────────────────────────────

  describe('executeFetch', () => {
    const mockFetch = jest.fn();

    beforeEach(() => {
      jest.resetAllMocks();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
    });

    it('sends Content-Type header', async () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client['executeFetch']('http://localhost:3001/test', { method: 'GET' });

      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = opts.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('includes Bearer token when set', async () => {
      const client = new Client({ baseUrl: 'http://localhost:3001', token: 'my-jwt' });
      await client['executeFetch']('http://localhost:3001/test', { method: 'GET' });

      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = opts.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer my-jwt');
    });

    it('includes API key when set', async () => {
      const client = new Client({ baseUrl: 'http://localhost:3001', apiKey: 'sk-test' });
      await client['executeFetch']('http://localhost:3001/test', { method: 'GET' });

      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = opts.headers as Record<string, string>;
      expect(headers['x-api-key']).toBe('sk-test');
    });

    it('merges caller-supplied headers', async () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client['executeFetch']('http://localhost:3001/test', {
        method: 'GET',
        headers: { 'X-Custom': 'val' },
      });

      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = opts.headers as Record<string, string>;
      expect(headers['X-Custom']).toBe('val');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('aborts after timeout', async () => {
      jest.useFakeTimers();

      // Mock that rejects when the signal is aborted
      mockFetch.mockImplementation((_url: string, opts: RequestInit) => {
        return new Promise((_resolve, reject) => {
          const signal = opts.signal as AbortSignal;
          if (signal.aborted) {
            reject(new DOMException('The operation was aborted', 'AbortError'));
            return;
          }
          signal.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        });
      });

      const client = new Client({ baseUrl: 'http://localhost:3001', timeoutMs: 100 });

      const fetchPromise = client['executeFetch']('http://localhost:3001/test', { method: 'GET' });
      jest.advanceTimersByTime(100);

      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.signal).toBeInstanceOf(AbortSignal);
      expect(opts.signal?.aborted).toBe(true);

      await expect(fetchPromise).rejects.toThrow();
      jest.useRealTimers();
    });

    it('passes the signal to fetch', async () => {
      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client['executeFetch']('http://localhost:3001/test', { method: 'GET' });

      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.signal).toBeInstanceOf(AbortSignal);
    });
  });

  // ─── Retry Logic ────────────────────────────────────────────────────────────

  describe('request retry logic', () => {
    const mockFetch = jest.fn();

    beforeEach(() => {
      jest.resetAllMocks();
      jest.useFakeTimers();
      global.fetch = mockFetch;
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('succeeds on first attempt', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { score: 750 } }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      const result = await client.get('/score/test');
      expect(result).toEqual({ success: true, data: { score: 750 } });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 503 and succeeds on second attempt', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ success: false, message: 'Service Unavailable' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { score: 750 } }),
        });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 3 });

      // Start the request (it will wait on the sleep between retries)
      const requestPromise = client.get('/score/test');

      // Advance past the 200ms backoff
      await jest.advanceTimersByTimeAsync(1000);

      const result = await requestPromise;
      expect(result).toEqual({ success: true, data: { score: 750 } });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry on 400', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Bad request' },
        }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 3 });

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('does not retry on 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
        }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 3 });

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry on 404', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Not found' },
        }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 3 });

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries on 429 (rate limited)', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: async () => ({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too fast' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 3 });

      const requestPromise = client.get('/test');
      await jest.advanceTimersByTimeAsync(1000);

      await expect(requestPromise).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('throws after exhausting all retries on 503', async () => {
      // Use real timers for deterministic retry behavior
      jest.useRealTimers();

      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          success: false,
          error: { code: 'EXTERNAL_SERVICE_ERROR', message: 'Down' },
        }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 2 });

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('retries on network error', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 3 });

      const requestPromise = client.get('/test');
      await jest.advanceTimersByTimeAsync(1000);

      await expect(requestPromise).resolves.toBeDefined();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('respects maxRetries=0 (no retries)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ success: false, message: 'Down' }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001', maxRetries: 0 });

      await expect(client.get('/test')).rejects.toThrow(ApiError);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ─── HTTP Method Helpers ────────────────────────────────────────────────────

  describe('HTTP method helpers', () => {
    const mockFetch = jest.fn();

    beforeEach(() => {
      jest.resetAllMocks();
      global.fetch = mockFetch;
    });

    it('get() sends GET', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client.get('/test');
      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.method).toBe('GET');
    });

    it('post() sends POST with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client.post('/test', { key: 'value' });
      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.method).toBe('POST');
      expect(opts.body).toBe('{"key":"value"}');
    });

    it('post() omits body when undefined', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client.post('/test');
      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.method).toBe('POST');
      expect(opts.body).toBeUndefined();
    });

    it('put() sends PUT with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client.put('/test', { key: 'value' });
      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.method).toBe('PUT');
    });

    it('patch() sends PATCH with JSON body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client.patch('/test', { key: 'value' });
      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.method).toBe('PATCH');
    });

    it('delete() sends DELETE', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      await client.delete('/test');
      const [_, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(opts.method).toBe('DELETE');
    });

    it('raw() returns Response directly', async () => {
      const mockResponse = { ok: true, status: 200, body: null };
      mockFetch.mockResolvedValue(mockResponse);

      const client = new Client({ baseUrl: 'http://localhost:3001' });
      const result = await client.raw('/events/stream');
      expect(result).toBe(mockResponse);
    });
  });
});
