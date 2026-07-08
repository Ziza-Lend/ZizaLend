/**
 * User module.
 *
 * User profile management.
 */

import { Client } from './client.js';

export interface UserProfile {
  publicKey: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  locale?: string | null;
  avatarUrl?: string | null;
  role: 'admin' | 'borrower' | 'lender';
  createdAt: string;
}

export interface UpdateUserProfileInput {
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  locale?: string | null;
  avatarUrl?: string | null;
}

export class User {
  constructor(private client: Client) {}

  /**
   * Get the authenticated user's profile.
   */
  async getProfile(): Promise<UserProfile> {
    const response = await this.client.get<{ success: boolean; data: UserProfile }>('/user/profile');
    return response.data;
  }

  /**
   * Update the authenticated user's profile.
   */
  async updateProfile(input: UpdateUserProfileInput): Promise<UserProfile> {
    const response = await this.client.patch<{ success: boolean; data: UserProfile }>(
      '/user/profile',
      input,
    );
    return response.data;
  }
}
