/**
 * Unified Data Client
 * Automatically chooses between Supabase client and JWT client based on available authentication
 */

import { supabase } from '../../integrations/supabase/client';
import { createJwtClient, JwtClient } from './jwt-client';
import { useAuthStore } from '../../stores/authStore';

export type DataClient = {
  // Common operations that work with both clients
  get: <T>(endpoint: string) => Promise<T>;
  post: <T>(endpoint: string, data?: any) => Promise<T>;
  put: <T>(endpoint: string, data?: any) => Promise<T>;
  delete: <T>(endpoint: string) => Promise<T>;
  patch: <T>(endpoint: string, data?: any) => Promise<T>;
  
  // Client type indicator
  clientType: 'supabase' | 'jwt';
};

/**
 * Create a unified data client that automatically selects the appropriate client
 */
export function createUnifiedDataClient(): DataClient {
  const authState = useAuthStore.getState();
  const { session } = authState;
  const { jwt: siweJwt } = authState.siwe;

  // Prefer Supabase session if available
  if (session?.access_token) {
    return {
      clientType: 'supabase',
      async get<T>(endpoint: string): Promise<T> {
        const { data, error } = await supabase
          .from(endpoint.replace('/rest/v1/', ''))
          .select('*');
        
        if (error) throw error;
        return data as T;
      },
      async post<T>(endpoint: string, data?: any): Promise<T> {
        const { data: result, error } = await supabase
          .from(endpoint.replace('/rest/v1/', ''))
          .insert(data)
          .select();
        
        if (error) throw error;
        return result as T;
      },
      async put<T>(endpoint: string, data?: any): Promise<T> {
        const { data: result, error } = await supabase
          .from(endpoint.replace('/rest/v1/', ''))
          .update(data)
          .select();
        
        if (error) throw error;
        return result as T;
      },
      async delete<T>(endpoint: string): Promise<T> {
        const { data: result, error } = await supabase
          .from(endpoint.replace('/rest/v1/', ''))
          .delete()
          .select();
        
        if (error) throw error;
        return result as T;
      },
      async patch<T>(endpoint: string, data?: any): Promise<T> {
        const { data: result, error } = await supabase
          .from(endpoint.replace('/rest/v1/', ''))
          .update(data)
          .select();
        
        if (error) throw error;
        return result as T;
      },
    };
  }

  // Fall back to JWT client if SIWE JWT is available
  if (siweJwt) {
    const jwtClient = createJwtClient(siweJwt);
    return {
      clientType: 'jwt',
      get: <T>(endpoint: string) => jwtClient.get<T>(endpoint),
      post: <T>(endpoint: string, data?: any) => jwtClient.post<T>(endpoint, data),
      put: <T>(endpoint: string, data?: any) => jwtClient.put<T>(endpoint, data),
      delete: <T>(endpoint: string) => jwtClient.delete<T>(endpoint),
      patch: <T>(endpoint: string, data?: any) => jwtClient.patch<T>(endpoint, data),
    };
  }

  // No authentication available - return a client that throws errors
  return {
    clientType: 'supabase',
    async get<T>(): Promise<T> {
      throw new Error('No authentication available. Please sign in.');
    },
    async post<T>(): Promise<T> {
      throw new Error('No authentication available. Please sign in.');
    },
    async put<T>(): Promise<T> {
      throw new Error('No authentication available. Please sign in.');
    },
    async delete<T>(): Promise<T> {
      throw new Error('No authentication available. Please sign in.');
    },
    async patch<T>(): Promise<T> {
      throw new Error('No authentication available. Please sign in.');
    },
  };
}

/**
 * Hook to get the unified data client
 */
export function useDataClient(): DataClient {
  return createUnifiedDataClient();
}