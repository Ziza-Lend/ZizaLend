/**
 * Health check module.
 */

import { Client } from './client.js';

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  checks: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
    soroban_rpc: 'ok' | 'error';
  };
  uptime: number;
  timestamp: number;
}

export interface DeepHealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  checks: {
    db: 'ok' | 'down';
    redis: 'ok' | 'down';
    stellarRpc: 'ok' | 'down';
    indexer: {
      status: 'ok' | 'degraded' | 'down';
      lagLedgers: number | null;
    };
  };
  timestamp: number;
}

export interface VersionResponse {
  gitSha: string;
  builtAt: string;
  nodeVersion: string;
  contracts: {
    loanManager: string;
    lendingPool: string;
    remittanceNft: string;
    multisigGovernance: string;
  };
}

export class Health {
  constructor(private client: Client) {}

  /**
   * Basic health check.
   */
  async check(): Promise<HealthCheckResponse> {
    return this.client.get<{ status: string; checks: HealthCheckResponse['checks']; uptime: number; timestamp: number }>('/health') as unknown as Promise<HealthCheckResponse>;
  }

  /**
   * Deep health check with dependency-by-dependency status.
   */
  async deepCheck(): Promise<DeepHealthCheckResponse> {
    return this.client.get<DeepHealthCheckResponse>('/health/deep') as unknown as Promise<DeepHealthCheckResponse>;
  }

  /**
   * Get version and build metadata.
   */
  async getVersion(): Promise<VersionResponse> {
    return this.client.get<VersionResponse>('/version') as unknown as Promise<VersionResponse>;
  }
}
