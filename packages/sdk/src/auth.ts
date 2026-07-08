/**
 * Authentication module.
 *
 * Implements the Stellar wallet challenge/verify/login flow:
 * 1. Request a challenge message for the wallet
 * 2. User signs the challenge with their Stellar keypair
 * 3. Submit signed challenge to receive a JWT
 * 4. Use JWT for authenticated requests
 */

import { Client, ApiError } from './client.js';

export interface ChallengeMessage {
  message: string;
  nonce: string;
  timestamp: number;
  expiresIn: number;
}

export interface ChallengeResponse {
  success: boolean;
  data: ChallengeMessage;
}

export interface LoginData {
  token: string;
  publicKey: string;
}

export interface LoginResponse {
  success: boolean;
  data: LoginData;
}

export interface VerifyData {
  valid: boolean;
  publicKey?: string | null;
  role?: 'admin' | 'borrower' | 'lender' | null;
  scopes?: string[];
}

export interface VerifyResponse {
  success: boolean;
  data: VerifyData;
}

export class Auth {
  constructor(private client: Client) {}

  /**
   * Request a challenge message to sign with your Stellar wallet.
   * @param publicKey - Stellar public key (G...)
   */
  async requestChallenge(publicKey: string): Promise<ChallengeMessage> {
    const response = await this.client.post<ChallengeResponse>('/auth/challenge', {
      publicKey,
    });
    return response.data;
  }

  /**
   * Login by submitting a signed challenge message.
   * On success, the JWT token is automatically set on the client.
   * @param publicKey - Stellar public key
   * @param message - The original challenge message that was signed
   * @param signature - Base64-encoded Ed25519 signature
   * @returns LoginData containing the JWT and public key
   */
  async login(
    publicKey: string,
    message: string,
    signature: string,
  ): Promise<LoginData> {
    const response = await this.client.post<LoginResponse>('/auth/login', {
      publicKey,
      message,
      signature,
    });

    this.client.setToken(response.data.token);
    return response.data;
  }

  /**
   * Verify the current JWT token is still valid.
   */
  async verify(): Promise<VerifyData> {
    const response = await this.client.get<VerifyResponse>('/auth/verify');
    return response.data;
  }

  /**
   * Logout and revoke the current JWT token.
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Even if the token is already expired, clear it client-side
    } finally {
      this.client.setToken(undefined);
    }
  }

  /**
   * Full authentication flow:
   * 1. Request challenge
   * 2. Sign with wallet (caller provides signed message)
   * 3. Login with signed challenge
   *
   * @param publicKey - Stellar public key
   * @param signer - Async function that signs a message and returns base64 signature
   * @returns LoginData with JWT
   */
  async authenticate(
    publicKey: string,
    signer: (message: string) => Promise<string>,
  ): Promise<LoginData> {
    const challenge = await this.requestChallenge(publicKey);
    const signature = await signer(challenge.message);
    return this.login(publicKey, challenge.message, signature);
  }

  /**
   * Convenience method to check if the client is currently authenticated.
   */
  isAuthenticated(): boolean {
    return this.client.hasToken();
  }
}
