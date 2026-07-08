/**
 * Pool module.
 *
 * Lending pool operations: stats, deposits, withdrawals, yield history.
 */

import { Client } from './client.js';

export interface PoolStats {
  totalDeposits: number;
  totalOutstanding: number;
  utilizationRate: number;
  apy: number;
  activeLoansCount: number;
}

export interface PoolStatsResponse {
  success: boolean;
  data: PoolStats;
}

export interface DepositorPortfolio {
  address: string;
  depositAmount: number;
  sharePercent: number;
  estimatedYield: number;
  apy: number;
  firstDepositAt?: string | null;
}

export interface DepositorPortfolioResponse {
  success: boolean;
  data: DepositorPortfolio;
}

export interface SharePriceResponse {
  success: boolean;
  data: {
    token: string;
    price: number;
    cached: boolean;
  };
}

export interface BuildPoolTxParams {
  depositorPublicKey: string;
  token: string;
  amount: string;
}

export interface UnsignedTransactionResponse {
  success: boolean;
  unsignedTxXdr: string;
  networkPassphrase: string;
}

export interface SubmittedTransactionResponse {
  success: boolean;
  txHash: string;
  status: string;
  resultXdr?: string;
}

export class Pool {
  constructor(private client: Client) {}

  /**
   * Get lending pool statistics.
   */
  async getStats(): Promise<PoolStats> {
    const response = await this.client.get<PoolStatsResponse>('/pool/stats');
    return response.data;
  }

  /**
   * Get the authenticated user's depositor portfolio.
   */
  async getPortfolio(): Promise<DepositorPortfolio> {
    const response = await this.client.get<DepositorPortfolioResponse>('/pool/portfolio');
    return response.data;
  }

  /**
   * Get the current share price for a token.
   */
  async getSharePrice(token: string): Promise<SharePriceResponse['data']> {
    const response = await this.client.get<SharePriceResponse>('/pool/share-price', { token });
    return response.data;
  }

  /**
   * Get yield history for the authenticated depositor.
   */
  async getYieldHistory(params?: { token?: string; days?: number }): Promise<unknown> {
    return this.client.get('/pool/yield-history', params);
  }

  /**
   * Build an unsigned deposit transaction.
   */
  async buildDepositTx(params: BuildPoolTxParams): Promise<UnsignedTransactionResponse> {
    return this.client.post<UnsignedTransactionResponse>('/pool/deposit', params);
  }

  /**
   * Build an unsigned withdraw transaction.
   */
  async buildWithdrawTx(params: BuildPoolTxParams): Promise<UnsignedTransactionResponse> {
    return this.client.post<UnsignedTransactionResponse>('/pool/withdraw', params);
  }

  /**
   * Build an unsigned emergency withdraw transaction.
   */
  async buildEmergencyWithdrawTx(): Promise<UnsignedTransactionResponse> {
    return this.client.post<UnsignedTransactionResponse>('/pool/emergency-withdraw');
  }

  /**
   * Submit a signed pool transaction.
   */
  async submitTransaction(signedTxXdr: string): Promise<SubmittedTransactionResponse> {
    return this.client.post<SubmittedTransactionResponse>('/pool/submit', {
      signedTxXdr,
    });
  }
}
