/**
 * Events module.
 *
 * Real-time event streaming via SSE and historical event queries.
 */

import { Client } from './client.js';

export interface LoanEventRecord {
  eventId: string;
  eventType: string;
  loanId?: number;
  address?: string;
  amount?: string;
  ledger: number;
  ledgerClosedAt: string;
  txHash: string;
  contractId?: string;
  interestRateBps?: number;
  termLedgers?: number;
  topics?: string[];
  value?: string;
  createdAt?: string;
}

export interface PaginatedEventsResponse {
  success: boolean;
  data: {
    events: LoanEventRecord[];
    pagination: {
      limit: number;
      next_cursor?: string | null;
      has_next?: boolean;
    };
  };
}

export interface EventStreamStatusResponse {
  success: boolean;
  data: {
    borrower: number;
    admin: number;
    total: number;
  };
}

export class Events {
  constructor(private client: Client) {}

  /**
   * Get the SSE stream URL for real-time loan events.
   * Connect with EventSource or similar SSE client.
   */
  getStreamUrl(borrower?: string): string {
    const baseUrl = this.client.getBaseUrl();
    const url = new URL(`${baseUrl}/events/stream`);
    if (borrower) {
      url.searchParams.set('borrower', borrower);
    }
    return url.toString();
  }

  /**
   * Get current SSE connection counts (admin).
   */
  async getStreamStatus(): Promise<EventStreamStatusResponse['data']> {
    const response = await this.client.get<EventStreamStatusResponse>('/events/status');
    return response.data;
  }
}
