/**
 * Lens Protocol v3 Storage Utilities
 *
 * Clean storage utilities for Lens v3 sessions and metadata
 * Removes all mock behavior and duplicated functionality
 */

import type { LensAuthTokens, Account } from "./types";

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKENS: "lens.auth.tokens",
  CURRENT_ACCOUNT: "lens.current.account",
  USER_PREFERENCES: "lens.user.preferences",
  SESSION_CACHE: "lens.session.cache",
} as const;

/**
 * Storage wrapper with error handling
 */
class LensStorage {
  private isAvailable(): boolean {
    try {
      return typeof window !== "undefined" && !!window.localStorage;
    } catch {
      return false;
    }
  }

  private getItem(key: string): string | null {
    if (!this.isAvailable()) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to get item from storage: ${key}`, error);
      return null;
    }
  }

  private setItem(key: string, value: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set item in storage: ${key}`, error);
      return false;
    }
  }

  private removeItem(key: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove item from storage: ${key}`, error);
      return false;
    }
  }

  // Auth tokens management
  setAuthTokens(tokens: LensAuthTokens): boolean {
    return this.setItem(STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(tokens));
  }

  getAuthTokens(): LensAuthTokens | null {
    const stored = this.getItem(STORAGE_KEYS.AUTH_TOKENS);
    if (!stored) return null;

    try {
      const tokens = JSON.parse(stored) as LensAuthTokens;

      // Check if tokens are expired
      const expiresAt = new Date(tokens.expiresAt);
      if (expiresAt <= new Date()) {
        this.clearAuthTokens();
        return null;
      }

      return tokens;
    } catch (error) {
      console.warn("Failed to parse stored auth tokens", error);
      this.clearAuthTokens();
      return null;
    }
  }

  clearAuthTokens(): boolean {
    return this.removeItem(STORAGE_KEYS.AUTH_TOKENS);
  }

  // Current account management
  setCurrentAccount(account: Account): boolean {
    return this.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, JSON.stringify(account));
  }

  getCurrentAccount(): Account | null {
    const stored = this.getItem(STORAGE_KEYS.CURRENT_ACCOUNT);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as Account;
    } catch (error) {
      console.warn("Failed to parse stored account", error);
      this.clearCurrentAccount();
      return null;
    }
  }

  clearCurrentAccount(): boolean {
    return this.removeItem(STORAGE_KEYS.CURRENT_ACCOUNT);
  }

  // User preferences
  setUserPreferences(preferences: any): boolean {
    return this.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences),
    );
  }

  getUserPreferences(): any | null {
    const stored = this.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn("Failed to parse stored preferences", error);
      this.clearUserPreferences();
      return null;
    }
  }

  clearUserPreferences(): boolean {
    return this.removeItem(STORAGE_KEYS.USER_PREFERENCES);
  }

  // Session cache
  setSessionCache(data: any): boolean {
    const cacheData = {
      ...data,
      timestamp: Date.now(),
    };
    return this.setItem(STORAGE_KEYS.SESSION_CACHE, JSON.stringify(cacheData));
  }

  getSessionCache(maxAge: number = 5 * 60 * 1000): any | null {
    const stored = this.getItem(STORAGE_KEYS.SESSION_CACHE);
    if (!stored) return null;

    try {
      const cache = JSON.parse(stored);
      const isExpired = Date.now() - cache.timestamp > maxAge;

      if (isExpired) {
        this.clearSessionCache();
        return null;
      }

      return cache;
    } catch (error) {
      console.warn("Failed to parse session cache", error);
      this.clearSessionCache();
      return null;
    }
  }

  clearSessionCache(): boolean {
    return this.removeItem(STORAGE_KEYS.SESSION_CACHE);
  }

  // Clear all Lens data
  clearAll(): boolean {
    const results = [
      this.clearAuthTokens(),
      this.clearCurrentAccount(),
      this.clearUserPreferences(),
      this.clearSessionCache(),
    ];

    return results.every(Boolean);
  }

  // Get storage usage info
  getStorageInfo(): {
    isAvailable: boolean;
    usage: number;
    hasTokens: boolean;
    hasAccount: boolean;
  } {
    const isAvailable = this.isAvailable();

    if (!isAvailable) {
      return {
        isAvailable: false,
        usage: 0,
        hasTokens: false,
        hasAccount: false,
      };
    }

    let usage = 0;
    try {
      for (const key in localStorage) {
        if (key.startsWith("lens.")) {
          usage += localStorage[key].length;
        }
      }
    } catch {
      // Storage access failed
    }

    return {
      isAvailable: true,
      usage,
      hasTokens: this.getAuthTokens() !== null,
      hasAccount: this.getCurrentAccount() !== null,
    };
  }
}

// Export singleton instance
export const lensStorage = new LensStorage();

// Export utility functions
export const setAuthTokens = (tokens: LensAuthTokens) =>
  lensStorage.setAuthTokens(tokens);
export const getAuthTokens = () => lensStorage.getAuthTokens();
export const clearAuthTokens = () => lensStorage.clearAuthTokens();

export const setCurrentAccount = (account: Account) =>
  lensStorage.setCurrentAccount(account);
export const getCurrentAccount = () => lensStorage.getCurrentAccount();
export const clearCurrentAccount = () => lensStorage.clearCurrentAccount();

export const clearAllLensData = () => lensStorage.clearAll();
export const getLensStorageInfo = () => lensStorage.getStorageInfo();

// Session management helpers
export const hasValidSession = (): boolean => {
  const tokens = getAuthTokens();
  const account = getCurrentAccount();
  return tokens !== null && account !== null;
};

export const getSessionData = () => {
  return {
    tokens: getAuthTokens(),
    account: getCurrentAccount(),
    isValid: hasValidSession(),
  };
};

export const clearSession = () => {
  clearAuthTokens();
  clearCurrentAccount();
  lensStorage.clearSessionCache();
};
