/**
 * Secure RevenueCat Configuration Management
 * 
 * This module handles RevenueCat API keys securely by:
 * 1. Not exposing keys in client-side bundles
 * 2. Providing fallback behavior when keys are unavailable
 * 3. Supporting both development and production environments
 */

export interface RevenueCatConfig {
  ios: string;
  android: string;
}

export interface SecureRevenueCatConfig {
  isAvailable: boolean;
  config: RevenueCatConfig | null;
  error?: string;
}

/**
 * Securely loads RevenueCat configuration
 * In production, this should be replaced with a server-side endpoint
 * For now, we use environment variables with proper fallbacks
 */
export async function loadRevenueCatConfig(): Promise<SecureRevenueCatConfig> {
  try {
    // Check if we're in a development environment
    const isDev = import.meta.env.DEV;
    
    // In development, allow fallback keys for testing
    const devFallbacks = {
      ios: "appl_dev_fallback_key",
      android: "goog_dev_fallback_key"
    };

    let config: RevenueCatConfig | null = null;
    
    if (isDev) {
      // In development, use fallback keys for testing
      config = devFallbacks;
      console.warn("RevenueCat: Using development fallback keys. Real keys should be configured server-side.");
    } else {
      // In production, fetch keys from backend server
      try {
        const backendUrl = import.meta.env.VITE_HETZNER_SERVICE_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/config/revenuecat`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const serverConfig = await response.json();
          
          // Validate that we got proper keys
          if (serverConfig.ios && serverConfig.android) {
            config = {
              ios: serverConfig.ios,
              android: serverConfig.android
            };
            console.log("RevenueCat: Successfully loaded configuration from backend");
          } else {
            console.warn("RevenueCat: Backend returned incomplete configuration");
          }
        } else {
          console.warn(`RevenueCat: Backend configuration endpoint returned ${response.status}`);
        }
      } catch (fetchError) {
        console.warn("RevenueCat: Could not fetch configuration from backend:", fetchError);
        // This is expected if backend doesn't have RevenueCat configured yet
      }
    }

    return {
      isAvailable: config !== null,
      config,
      error: config ? undefined : "RevenueCat configuration not available - configure backend endpoint"
    };
  } catch (error) {
    console.error("Failed to load RevenueCat configuration:", error);
    return {
      isAvailable: false,
      config: null,
      error: error instanceof Error ? error.message : "Unknown configuration error"
    };
  }
}

/**
 * Gets the appropriate API key for the current platform
 */
export function getRevenueCatKeyForPlatform(config: RevenueCatConfig, platform: 'ios' | 'android'): string {
  return platform === 'ios' ? config.ios : config.android;
}

/**
 * Validates that a RevenueCat key is properly formatted
 */
export function isValidRevenueCatKey(key: string, platform: 'ios' | 'android'): boolean {
  if (!key || typeof key !== 'string') return false;
  
  const expectedPrefix = platform === 'ios' ? 'appl_' : 'goog_';
  return key.startsWith(expectedPrefix) && key.length > expectedPrefix.length;
}

/**
 * Creates a mock configuration for testing/demo purposes
 */
export function createMockRevenueCatConfig(): RevenueCatConfig {
  return {
    ios: "appl_mock_key_for_testing",
    android: "goog_mock_key_for_testing"
  };
}
