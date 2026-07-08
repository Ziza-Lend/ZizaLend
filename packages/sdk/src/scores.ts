/**
 * Scores module.
 *
 * Credit score queries, breakdowns, history, and updates.
 */

import { Client } from './client.js';

export interface UserScore {
  success: boolean;
  userId: string;
  score: number;
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface ScoreBreakdownMetrics {
  totalLoans: number;
  repaidOnTime: number;
  repaidLate: number;
  defaulted: number;
  totalRepaid: number;
  averageRepaymentTime: string;
  longestStreak: number;
  currentStreak: number;
}

export interface ScoreHistoryEntry {
  date: string | null;
  score: number;
  event: string;
}

export interface ScoreBreakdownResponse {
  success: boolean;
  userId: string;
  score: number;
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  breakdown: ScoreBreakdownMetrics;
  history: ScoreHistoryEntry[];
}

export interface ScoreUpdateResponse {
  success: boolean;
  userId: string;
  repaymentAmount: number;
  onTime: boolean;
  oldScore: number;
  delta: number;
  newScore: number;
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export class Scores {
  constructor(private client: Client) {}

  /**
   * Get the credit score for a user.
   */
  async get(userId: string): Promise<UserScore> {
    return this.client.get<UserScore>(`/score/${userId}`);
  }

  /**
   * Get detailed score breakdown with metrics and history.
   */
  async getBreakdown(userId: string): Promise<ScoreBreakdownResponse> {
    return this.client.get<ScoreBreakdownResponse>(`/score/${userId}/breakdown`);
  }

  /**
   * Get score history timeline.
   */
  async getHistory(userId: string): Promise<ScoreHistoryEntry[]> {
    const response = await this.client.get<{ success: boolean; data: ScoreHistoryEntry[] }>(
      `/score/${userId}/history`,
    );
    return response.data;
  }

  /**
   * Update a user's score (internal - requires API key).
   */
  async update(
    userId: string,
    params: { repaymentAmount: number; onTime: boolean },
  ): Promise<ScoreUpdateResponse> {
    return this.client.post<ScoreUpdateResponse>('/score/update', {
      userId,
      ...params,
    });
  }
}
