import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

const mockBuildHistory =
  jest.fn<
    (address: string, token: string, days: number, currentSharePrice?: number) => Promise<unknown[]>
  >();
const mockGetSharePrice = jest.fn<() => Promise<number>>();

jest.unstable_mockModule('../services/yieldHistoryService.js', () => ({
  buildDepositorYieldHistory: mockBuildHistory,
  computeApy: (netYield: number, deposited: number, days: number) =>
    deposited > 0 ? (netYield / deposited) * (365 / days) * 100 : 0,
  normalizeYieldHistoryDays: (days?: number) =>
    days === 7 || days === 30 || days === 90 ? days : 30,
}));

jest.unstable_mockModule('../services/sorobanService.js', () => ({
  sorobanService: {
    getSharePrice: mockGetSharePrice,
  },
}));

const { getDepositorYieldHistory } = await import('../controllers/poolController.js');

const flushAsync = async (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const createMockResponse = (): Response =>
  ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as Response;

describe('getDepositorYieldHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.POOL_TOKEN_ADDRESS = 'GTokenAddress';
    mockGetSharePrice.mockResolvedValue(1_050_000);
    mockBuildHistory.mockResolvedValue([
      {
        timestamp: '2026-05-01T00:00:00.000Z',
        depositedValue: 1000,
        currentValue: 1050,
        netYield: 50,
      },
    ]);
  });

  it('returns mapped yield history payload', async () => {
    const req = {
      params: { address: 'GDepositor' },
      query: { days: '30' },
    } as unknown as Request;
    const res = createMockResponse();
    const next = jest.fn<(err?: unknown) => void>();

    getDepositorYieldHistory(req, res, next as unknown as NextFunction);
    await flushAsync();

    expect(mockBuildHistory).toHaveBeenCalledWith('GDepositor', 'GTokenAddress', 30, 1_050_000);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        expect.objectContaining({
          depositedValue: 1000,
          currentValue: 1050,
          netYield: 50,
          earnings: 50,
          principal: 1000,
          apy: expect.any(Number),
        }),
      ],
    });
    expect(next).not.toHaveBeenCalled();
  });
});
