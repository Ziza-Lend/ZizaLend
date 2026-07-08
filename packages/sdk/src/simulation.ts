/**
 * Simulation module.
 *
 * Test and simulation endpoints for development and testing.
 */

import { Client } from './client.js';

export interface RemittanceHistoryResponse {
  userId: string;
  score: number;
  streak: number;
  history: Array<{
    month: string;
    amount: number;
    status: 'Completed' | 'Defaulted';
  }>;
}

export interface SimulatePaymentResponse {
  success: boolean;
  message: string;
  newScore: number;
}

export class Simulation {
  constructor(private client: Client) {}

  /**
   * Get simulated remittance history for a user.
   */
  async getRemittanceHistory(userId: string): Promise<RemittanceHistoryResponse> {
    return this.client.get<RemittanceHistoryResponse>('/simulate/remittance-history', { userId });
  }

  /**
   * Simulate a payment and see the impact on credit score.
   */
  async simulatePayment(params: {
    userId: string;
    amount: number;
    onTime: boolean;
  }): Promise<SimulatePaymentResponse> {
    return this.client.post<SimulatePaymentResponse>('/simulate/payment', params);
  }
}
