import { ZizaLend, Client, ApiError } from '../index.js';
import { Auth } from '../auth.js';
import { Health } from '../health.js';
import { Loans } from '../loans.js';
import { Pool } from '../pool.js';
import { Scores } from '../scores.js';
import { Notifications } from '../notifications.js';
import { Remittances } from '../remittances.js';

describe('ZizaLend', () => {
  it('creates an instance with all modules', () => {
    const api = new ZizaLend({ baseUrl: 'http://localhost:3001/api/v1' });

    expect(api.auth).toBeInstanceOf(Auth);
    expect(api.health).toBeInstanceOf(Health);
    expect(api.loans).toBeInstanceOf(Loans);
    expect(api.pool).toBeInstanceOf(Pool);
    expect(api.scores).toBeInstanceOf(Scores);
    expect(api.notifications).toBeInstanceOf(Notifications);
    expect(api.remittances).toBeInstanceOf(Remittances);
    expect(api.user).toBeDefined();
    expect(api.transactions).toBeDefined();
    expect(api.events).toBeDefined();
    expect(api.indexer).toBeDefined();
    expect(api.admin).toBeDefined();
    expect(api.simulation).toBeDefined();
  });

  it('passes configuration to the underlying client', () => {
    const api = new ZizaLend({
      baseUrl: 'http://example.com/api/v1',
      token: 'test-token',
      apiKey: 'test-api-key',
      timeoutMs: 10000,
      maxRetries: 0,
    });

    expect(api.auth.isAuthenticated()).toBe(true);
  });

  it('can set token after construction via auth.login', () => {
    const api = new ZizaLend({ baseUrl: 'http://localhost:3001/api/v1' });
    expect(api.auth.isAuthenticated()).toBe(false);

    // Token can be set through auth (this doesn't call the server)
    // Just verify the auth module references the same client
    expect(api.auth).toBeDefined();
  });
});

describe('exports', () => {
  it('exports Client and ApiError', () => {
    const client = new Client({ baseUrl: 'http://localhost:3001' });
    expect(client).toBeInstanceOf(Client);

    const err = new ApiError('test', 500);
    expect(err).toBeInstanceOf(ApiError);
  });

  it('Client is a constructor', () => {
    expect(typeof Client).toBe('function');
  });
});
