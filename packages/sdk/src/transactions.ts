/**
 * Transactions module.
 *
 * Transaction history for the authenticated user.
 */

import { Client } from './client.js';

export interface Transaction {
  id: number;
  type: string;
  amount: string;
  status: string;
  txHash?: string | null;
  createdAt: string;
}

export interface TransactionsResponse {
  success: boolean;
  data: Transaction[];
  page_info?: {
    limit: number;
    next_cursor?: string | null;
    has_previous?: boolean;
  };
}

export class Transactions {
  constructor(private client: Client) {}

  /**
   * Get the authenticated user's transaction history.
   */
  async list(params?: { limit?: number; cursor?: string }): Promise<TransactionsResponse> {
    return this.client.get<TransactionsResponse>('/transactions/me', params);
  }
}
