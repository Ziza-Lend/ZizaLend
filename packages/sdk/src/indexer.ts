/**
 * Indexer module.
 *
 * Event indexer management, webhook subscriptions, and admin operations.
 */

import { Client } from './client.js';
import type { PaginatedEventsResponse, LoanEventRecord } from './events.js';

export interface IndexerStatusData {
  lastIndexedLedger: number;
  lastIndexedCursor: string | null;
  lastUpdated: string;
  totalEvents: number;
  eventsByType: Record<string, number>;
}

export interface IndexerStatusResponse {
  success: boolean;
  data: IndexerStatusData;
}

export interface WebhookSubscription {
  id: number;
  callbackUrl: string;
  eventTypes: string[];
  secret?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookSubscriptionInput {
  callbackUrl: string;
  eventTypes: string[];
  secret?: string;
}

export interface WebhookDelivery {
  id: number;
  subscriptionId: number;
  eventId: string;
  eventType: string;
  attemptCount: number;
  lastStatusCode?: number;
  lastError?: string;
  deliveredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReindexResult {
  fromLedger: number;
  toLedger: number;
  fetchedEvents: number;
  insertedEvents: number;
  lastProcessedLedger: number;
}

export interface DefaultCheckRunResult {
  runId: string;
  currentLedger: number;
  termLedgers: number;
  overdueCount: number;
  loansChecked: number;
  successfulSubmissions: number;
  failedSubmissions: number;
  batches: Array<Record<string, unknown>>;
}

export class Indexer {
  constructor(private client: Client) {}

  /**
   * Get event indexer status.
   */
  async getStatus(): Promise<IndexerStatusData> {
    const response = await this.client.get<IndexerStatusResponse>('/indexer/status');
    return response.data;
  }

  /**
   * Get events for a specific borrower.
   */
  async getBorrowerEvents(
    borrower: string,
    params?: { limit?: number; cursor?: string },
  ): Promise<PaginatedEventsResponse['data']> {
    const response = await this.client.get<PaginatedEventsResponse>(
      `/indexer/events/borrower/${borrower}`,
      params,
    );
    return response.data;
  }

  /**
   * Get events for a specific loan.
   */
  async getLoanEvents(loanId: number): Promise<{ events: LoanEventRecord[] }> {
    const response = await this.client.get<{ success: boolean; data: { events: LoanEventRecord[] } }>(
      `/indexer/events/loan/${loanId}`,
    );
    return response.data;
  }

  /**
   * Get recent events (admin).
   */
  async getRecentEvents(params?: {
    limit?: number;
    eventType?: string;
  }): Promise<LoanEventRecord[]> {
    const response = await this.client.get<{ success: boolean; data: { events: LoanEventRecord[] } }>(
      '/indexer/events/recent',
      params,
    );
    return response.data.events;
  }

  /**
   * Reindex a range of ledgers (admin).
   */
  async reindexRange(fromLedger: number, toLedger: number): Promise<ReindexResult> {
    const response = await this.client.post<{ success: boolean; data: ReindexResult }>(
      '/indexer/reindex',
      { fromLedger, toLedger },
    );
    return response.data;
  }

  /**
   * Run default check on overdue loans (admin).
   */
  async runDefaultCheck(): Promise<DefaultCheckRunResult> {
    const response = await this.client.post<{ success: boolean; data: DefaultCheckRunResult }>(
      '/indexer/default-check',
    );
    return response.data;
  }

  /**
   * List all webhook subscriptions (admin).
   */
  async listWebhooks(): Promise<WebhookSubscription[]> {
    const response = await this.client.get<{ success: boolean; data: { subscriptions: WebhookSubscription[] } }>(
      '/indexer/webhooks',
    );
    return response.data.subscriptions;
  }

  /**
   * Create a webhook subscription (admin).
   */
  async createWebhook(input: CreateWebhookSubscriptionInput): Promise<WebhookSubscription> {
    const response = await this.client.post<{ success: boolean; data: { subscription: WebhookSubscription } }>(
      '/indexer/webhooks',
      input,
    );
    return response.data.subscription;
  }

  /**
   * Delete a webhook subscription (admin).
   */
  async deleteWebhook(id: number): Promise<void> {
    await this.client.delete(`/indexer/webhooks/${id}`);
  }

  /**
   * Get webhook delivery history (admin).
   */
  async getWebhookDeliveries(subscriptionId: number): Promise<WebhookDelivery[]> {
    const response = await this.client.get<{ success: boolean; data: { deliveries: WebhookDelivery[] } }>(
      `/indexer/webhooks/${subscriptionId}/deliveries`,
    );
    return response.data.deliveries;
  }
}
