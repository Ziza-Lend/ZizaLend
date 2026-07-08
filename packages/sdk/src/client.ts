/**
 * Core HTTP client for the ZizaLend API.
 *
 * Handles authentication, request/response serialization, error handling,
 * retry logic for transient failures, and provides a typed fetch interface.
 */

export interface ClientConfig {
  /** Base URL for the API (e.g. http://localhost:3001/api/v1) */
  baseUrl: string;
  /** JWT token (set after login or from persisted session) */
  token?: string;
  /** API key for server-to-server admin endpoints */
  apiKey?: string;
  /** Request timeout in milliseconds (default: 60000) */
  timeoutMs?: number;
  /** Maximum retries for transient errors (default: 3) */
  maxRetries?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode?: string;
  public readonly field?: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    field?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.field = field;
    this.details = details;
  }

  get isAuthError(): boolean {
    return this.statusCode === 401;
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isValidationError(): boolean {
    return this.statusCode === 400 && this.errorCode === 'VALIDATION_ERROR';
  }
}

const TRANSIENT_STATUS_CODES = new Set([429, 502, 503, 504]);

export class Client {
  private readonly config: {
    baseUrl: string;
    token: string | undefined;
    apiKey: string | undefined;
    timeoutMs: number;
    maxRetries: number;
  };

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/+$/, ''),
      token: config.token,
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs ?? 60000,
      maxRetries: config.maxRetries ?? 3,
    };
  }

  /** Update the auth token (e.g. after login or token refresh) */
  setToken(token: string | undefined): void {
    this.config.token = token;
  }

  /** Update the API key */
  setApiKey(apiKey: string | undefined): void {
    this.config.apiKey = apiKey;
  }

  /** Check if a JWT token is currently set */
  hasToken(): boolean {
    return !!this.config.token;
  }

  /** Check if an API key is currently set */
  hasApiKey(): boolean {
    return !!this.config.apiKey;
  }

  /** Get current base URL */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Make a typed HTTP GET request.
   */
  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    init?: RequestInit,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const response = await this.request(url, { ...init, method: 'GET' });
    return response as T;
  }

  /**
   * Make a typed HTTP POST request.
   */
  async post<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const response = await this.request(url, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return response as T;
  }

  /**
   * Make a typed HTTP PUT request.
   */
  async put<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const response = await this.request(url, {
      ...init,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return response as T;
  }

  /**
   * Make a typed HTTP PATCH request.
   */
  async patch<T>(
    path: string,
    body?: unknown,
    init?: RequestInit,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const response = await this.request(url, {
      ...init,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return response as T;
  }

  /**
   * Make a typed HTTP DELETE request.
   */
  async delete<T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const response = await this.request(url, { ...init, method: 'DELETE' });
    return response as T;
  }

  /**
   * Make a raw request that returns the full Response object.
   * Useful for SSE streams or when you need to check response headers.
   */
  async raw(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    const url = this.buildUrl(path);
    return this.executeFetch(url, init ?? {});
  }

  // ─── Private helpers ─────────────────────────────────────────

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const url = new URL(`${this.config.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const response = await this.executeFetch(url, init);
        const body = await response.json() as ApiResponse<unknown>;

        if (!response.ok) {
          const apiError = new ApiError(
            body.error?.message ?? body.message ?? `HTTP ${response.status}`,
            response.status,
            body.error?.code,
            body.error?.field,
            body.error?.details,
          );

          // Don't retry client errors (4xx) except 429
          if (!TRANSIENT_STATUS_CODES.has(response.status)) {
            throw apiError;
          }

          // On last attempt, throw
          if (attempt >= this.config.maxRetries) {
            throw apiError;
          }

          lastError = apiError;
          // Exponential backoff
          await this.sleep(Math.pow(2, attempt) * 200);
          continue;
        }

        return body;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        // Network / timeout errors are transient
        if (attempt >= this.config.maxRetries) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error(String(error));
        await this.sleep(Math.pow(2, attempt) * 200);
      }
    }

    throw lastError ?? new Error('Request failed');
  }

  private async executeFetch(url: string, init: RequestInit): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Copy any caller-supplied headers
    if (init.headers) {
      const incoming = init.headers as Record<string, string>;
      for (const key of Object.keys(incoming)) {
        const val = incoming[key];
        if (val !== undefined) {
          headers[key] = val;
        }
      }
    }

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
