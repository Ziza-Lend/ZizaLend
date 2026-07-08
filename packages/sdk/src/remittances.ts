/**
 * Remittances module.
 *
 * Cross-border payment operations via Stellar blockchain.
 */

import { Client } from './client.js';

export interface Remittance {
  id: number;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  token: string;
  status: string;
  txHash?: string | null;
  createdAt: string;
}

export interface RemittanceResponse {
  success: boolean;
  data: Remittance;
  unsignedTxXdr?: string;
  networkPassphrase?: string;
}

export interface CreateRemittanceInput {
  recipientAddress: string;
  amount: string;
  token: string;
}

export interface PaginatedRemittancesResponse {
  success: boolean;
  data: Remittance[];
  page_info: {
    limit: number;
    next_cursor?: string | null;
    has_previous: boolean;
  };
}

export interface SubmittedTransactionResponse {
  success: boolean;
  txHash: string;
  status: string;
  resultXdr?: string;
}

export class Remittances {
  constructor(private client: Client) {}

  /**
   * Get remittances for the authenticated user.
   */
  async list(params?: { limit?: number; cursor?: string }): Promise<PaginatedRemittancesResponse> {
    return this.client.get<PaginatedRemittancesResponse>('/remittances', params);
  }

  /**
   * Create a new remittance (builds an unsigned transaction).
   */
  async create(input: CreateRemittanceInput): Promise<RemittanceResponse> {
    return this.client.post<RemittanceResponse>('/remittances', input);
  }

  /**
   * Get a specific remittance by ID.
   */
  async get(id: number): Promise<RemittanceResponse> {
    return this.client.get<RemittanceResponse>(`/remittances/${id}`);
  }

  /**
   * Submit a signed remittance transaction.
   */
  async submitTransaction(id: number, signedTxXdr: string): Promise<SubmittedTransactionResponse> {
    return this.client.post<SubmittedTransactionResponse>(`/remittances/${id}/submit`, {
      signedTxXdr,
    });
  }
}
