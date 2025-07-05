import { useEffect, useState } from 'react';
import { AIConfigManager } from '../lib/ai/config';

interface SecureStorageState {
  isInitialized: boolean;
  isSupported: boolean;
  error: string | null;
  migrationComplete: boolean;
}

/**
 * Hook to manage storage initialization and migration
 */
export const useSecureStorage = () => {
  const [state, setState] = useState<SecureStorageState>({
    isInitialized: false,
    isSupported: true, // We now always support some form of storage
    error: null,
    migrationComplete: false
  });

  useEffect(() => {
    let isMounted = true;
    const initializeStorage = async () => {
      try {
        // Initialize with tiered storage approach
        await AIConfigManager.initialize();
        
        // The storage is considered "supported" as we always have a fallback
        if (isMounted) {
          setState(prev => ({
          ...prev,
          isSupported: true,
          isInitialized: true,
          migrationComplete: true,
            error: null
          }));
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
        
        // Even if there's an error, we still have memory storage as fallback
        if (isMounted) {
          setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isInitialized: true,
            isSupported: true // Still supported through fallbacks
          }));
        }
      }
    };

    initializeStorage();
    
    // Cleanup function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};

/**
 * Hook to manage API keys with secure storage
 */
export const useSecureAPIKeys = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAPIKey = async (provider: string, apiKey: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await AIConfigManager.setApiKey(provider, apiKey);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to store API key';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getAPIKey = async (provider: string): Promise<string | null> => {
    try {
      return await AIConfigManager.getApiKey(provider);
    } catch (err) {
      console.error('Failed to retrieve API key:', err);
      return null;
    }
  };

  const removeAPIKey = (provider: string): void => {
    try {
      AIConfigManager.removeApiKey(provider);
    } catch (err) {
      console.error('Failed to remove API key:', err);
    }
  };

  const hasAPIKey = (provider: string): boolean => {
    try {
      return AIConfigManager.hasApiKey(provider);
    } catch (err) {
      console.error('Failed to check API key:', err);
      return false;
    }
  };

  const clearAllKeys = (): void => {
    try {
      AIConfigManager.clearAllKeys();
    } catch (err) {
      console.error('Failed to clear API keys:', err);
    }
  };

  return {
    setAPIKey,
    getAPIKey,
    removeAPIKey,
    hasAPIKey,
    clearAllKeys,
    loading,
    error,
    clearError: () => setError(null)
  };
};
