/**
 * Admin module.
 *
 * Administrative operations: audit logs, disputes, governance.
 */

import { Client } from './client.js';

export interface AuditLogEntry {
  id: number;
  actor: string;
  action: string;
  target?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
  status: number;
  createdAt: string;
}

export interface LoanDispute {
  id: number;
  loanId: number;
  borrower: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  resolution?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export class Admin {
  constructor(private client: Client) {}

  /**
   * List audit logs (admin).
   */
  async listAuditLogs(params?: {
    limit?: number;
    cursor?: string;
    actor?: string;
    action?: string;
  }): Promise<AuditLogEntry[]> {
    const response = await this.client.get<{ success: boolean; data: AuditLogEntry[]; page_info?: unknown }>(
      '/admin/audit-logs',
      params,
    );
    return response.data;
  }

  /**
   * List loan disputes (admin).
   */
  async listLoanDisputes(): Promise<LoanDispute[]> {
    const response = await this.client.get<{ success: boolean; data: LoanDispute[] }>(
      '/admin/loan-disputes',
    );
    return response.data;
  }

  /**
   * Get a specific loan dispute.
   */
  async getLoanDispute(disputeId: number): Promise<LoanDispute> {
    const response = await this.client.get<{ success: boolean; data: LoanDispute }>(
      `/admin/loan-disputes/${disputeId}`,
    );
    return response.data;
  }

  /**
   * Get pending governance proposals.
   */
  async getPendingGovernance(): Promise<unknown> {
    return this.client.get('/admin/governance/pending');
  }
}
