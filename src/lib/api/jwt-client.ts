/**
 * JWT-based API Client
 * Provides authenticated data operations using third-party JWTs (e.g., from SIWE)
 */

import { supabase as supabaseConfig } from '../../config/environment';

export interface JwtClientOptions {
  jwt: string;
  baseUrl?: string;
}

export class JwtClient {
  private jwt: string;
  private baseUrl: string;

  constructor(options: JwtClientOptions) {
    this.jwt = options.jwt;
    this.baseUrl = options.baseUrl || supabaseConfig.url;
  }

  /**
   * Make an authenticated request using the JWT
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
        'apikey': supabaseConfig.anonKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`JWT API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * GET request with JWT authentication
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request with JWT authentication
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request with JWT authentication
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request with JWT authentication
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * PATCH request with JWT authentication
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

/**
 * Create a JWT client instance
 */
export function createJwtClient(jwt: string, baseUrl?: string): JwtClient {
  return new JwtClient({ jwt, baseUrl });
}

/**
 * Hook to get a JWT client when SIWE JWT is available
 */
export function useJwtClient(): JwtClient | null {
  // This would typically use the auth store to get the JWT
  // For now, we'll return null and let components handle the logic
  return null;
}