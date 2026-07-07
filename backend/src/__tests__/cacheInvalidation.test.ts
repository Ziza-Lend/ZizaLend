import { jest, describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Tests that each write path busts the correct cache keys.
 * Strategy: warm the mock cache with a sentinel value, trigger the write
 * helper, then assert the sentinel is gone (i.e. delete was called with the
 * right key).
 */

const mockDelete = jest.fn<(key: string) => Promise<void>>().mockResolvedValue(undefined);
const mockSet = jest
  .fn<(key: string, value: unknown) => Promise<void>>()
  .mockResolvedValue(undefined);
const mockGet = jest.fn<(key: string) => Promise<null>>().mockResolvedValue(null);

jest.unstable_mockModule('../services/cacheService.js', () => ({
  cacheService: {
    get: mockGet,
    set: mockSet,
    delete: mockDelete,
    ping: jest.fn<() => Promise<string>>().mockResolvedValue('ok'),
    invalidatePattern: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
}));

const {
  CacheKeys,
  invalidateOnRepay,
  invalidateOnLoanRequest,
  invalidateOnDeposit,
  invalidateOnWithdraw,
} = await import('../utils/cacheKeys.js');

const BORROWER = 'Gborrower123';
const DEPOSITOR = 'GDEPOSITOR456';
const LOAN_ID = 42;

describe('cacheKeys helpers', () => {
  beforeEach(() => {
    mockDelete.mockClear();
    mockSet.mockClear();
    mockGet.mockClear();
  });

  describe('CacheKeys generators', () => {
    it('poolStats returns a stable key', () => {
      expect(CacheKeys.poolStats()).toBe('pool:stats');
    });

    it('borrowerLoans encodes the borrower address', () => {
      expect(CacheKeys.borrowerLoans(BORROWER)).toBe(`borrower:loans:${BORROWER}`);
    });

    it('scoreBreakdown encodes the public key', () => {
      expect(CacheKeys.scoreBreakdown(BORROWER)).toBe(`score:breakdown:${BORROWER}`);
    });
  });

  describe('invalidateOnRepay', () => {
    it('deletes pool stats, borrower loans, and score breakdown', async () => {
      await invalidateOnRepay(BORROWER, LOAN_ID);

      const deletedKeys = mockDelete.mock.calls.map((c) => c[0]);
      expect(deletedKeys).toContain(CacheKeys.poolStats());
      expect(deletedKeys).toContain(CacheKeys.borrowerLoans(BORROWER));
      expect(deletedKeys).toContain(CacheKeys.scoreBreakdown(BORROWER));
    });

    it('calls delete exactly 3 times', async () => {
      await invalidateOnRepay(BORROWER, LOAN_ID);
      expect(mockDelete).toHaveBeenCalledTimes(3);
    });
  });

  describe('invalidateOnLoanRequest', () => {
    it('deletes pool stats and borrower loans', async () => {
      await invalidateOnLoanRequest(BORROWER);

      const deletedKeys = mockDelete.mock.calls.map((c) => c[0]);
      expect(deletedKeys).toContain(CacheKeys.poolStats());
      expect(deletedKeys).toContain(CacheKeys.borrowerLoans(BORROWER));
    });

    it('calls delete exactly 2 times', async () => {
      await invalidateOnLoanRequest(BORROWER);
      expect(mockDelete).toHaveBeenCalledTimes(2);
    });
  });

  describe('invalidateOnDeposit', () => {
    it('deletes pool stats', async () => {
      await invalidateOnDeposit(DEPOSITOR);

      expect(mockDelete).toHaveBeenCalledWith(CacheKeys.poolStats());
    });

    it('calls delete exactly once', async () => {
      await invalidateOnDeposit(DEPOSITOR);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateOnWithdraw', () => {
    it('deletes pool stats', async () => {
      await invalidateOnWithdraw(DEPOSITOR);

      expect(mockDelete).toHaveBeenCalledWith(CacheKeys.poolStats());
    });

    it('calls delete exactly once', async () => {
      await invalidateOnWithdraw(DEPOSITOR);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache warm → write → recompute flow', () => {
    it('next get returns null after invalidateOnRepay flushes the key', async () => {
      // Simulate a warmed cache for borrower loans
      const cache: Record<string, unknown> = {
        [CacheKeys.borrowerLoans(BORROWER)]: { loans: [] },
      };

      mockGet.mockImplementation(async (key: string) => {
        return ((cache[key] as unknown) ?? null) as null;
      });
      mockDelete.mockImplementation(async (key: string) => {
        delete cache[key];
      });

      // Confirm warm
      expect(await mockGet(CacheKeys.borrowerLoans(BORROWER))).not.toBeNull();

      // Trigger write invalidation
      await invalidateOnRepay(BORROWER, LOAN_ID);

      // Cache entry should be gone; next read recomputes from DB
      expect(await mockGet(CacheKeys.borrowerLoans(BORROWER))).toBeNull();
    });
  });
});
