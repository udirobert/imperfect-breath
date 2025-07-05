/**
 * Secure Storage Utility
 * Replaces localStorage API key storage with encrypted sessionStorage
 * Uses Web Crypto API for client-side encryption
 */

interface EncryptedData {
  iv: string;
  data: string;
}

class SecureStorageManager {
  private static readonly STORAGE_PREFIX = 'secure_';
  private static readonly KEY_DERIVATION_SALT = 'imperfect-breath-salt-2024';
  private static encryptionKey: CryptoKey | null = null;

  /**
   * Initialize encryption key from user session
   */
  private static async getEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey;
    }

    // Derive key from a combination of session data and salt
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.KEY_DERIVATION_SALT + Date.now().toString().slice(0, -7)),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    this.encryptionKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(this.KEY_DERIVATION_SALT),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return this.encryptionKey;
  }

  /**
   * Encrypt data using AES-GCM
   */
  private static async encrypt(data: string): Promise<EncryptedData> {
    const key = await this.getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encryptedData = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    return {
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      data: Array.from(new Uint8Array(encryptedData)).map(b => b.toString(16).padStart(2, '0')).join('')
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  private static async decrypt(encryptedData: EncryptedData): Promise<string> {
    const key = await this.getEncryptionKey();
    const iv = new Uint8Array(encryptedData.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const data = new Uint8Array(encryptedData.data.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

    const decryptedData = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decryptedData);
  }

  /**
   * Store encrypted data in sessionStorage
   */
  static async setSecure(key: string, value: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(value);
      sessionStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw new Error('Secure storage failed');
    }
  }

  /**
   * Retrieve and decrypt data from sessionStorage
   */
  static async getSecure(key: string): Promise<string | null> {
    try {
      const stored = sessionStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (!stored) return null;

      const encrypted: EncryptedData = JSON.parse(stored);
      return await this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      // Clean up corrupted data
      this.removeSecure(key);
      return null;
    }
  }

  /**
   * Remove encrypted data from sessionStorage
   */
  static removeSecure(key: string): void {
    sessionStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
  }

  /**
   * Check if encrypted data exists
   */
  static hasSecure(key: string): boolean {
    return sessionStorage.getItem(`${this.STORAGE_PREFIX}${key}`) !== null;
  }

  /**
   * Clear all encrypted data
   */
  static clearAll(): void {
    const keys = Object.keys(sessionStorage).filter(key => key.startsWith(this.STORAGE_PREFIX));
    keys.forEach(key => sessionStorage.removeItem(key));
    this.encryptionKey = null;
  }

  /**
   * Check if Web Crypto API is available
   */
  static isSupported(): boolean {
    return typeof window !== 'undefined' && 
           'crypto' in window && 
           'subtle' in window.crypto &&
           typeof sessionStorage !== 'undefined';
  }
}

/**
 * API Key Manager with secure storage
 * Replaces the insecure localStorage implementation
 */
export class SecureAPIKeyManager {
  private static readonly API_KEY_PREFIX = 'api_key_';

  /**
   * Store API key securely
   */
  static async setAPIKey(provider: string, apiKey: string): Promise<void> {
    if (!SecureStorageManager.isSupported()) {
      throw new Error('Secure storage not supported in this environment');
    }

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    await SecureStorageManager.setSecure(`${this.API_KEY_PREFIX}${provider}`, apiKey.trim());
  }

  /**
   * Retrieve API key securely
   */
  static async getAPIKey(provider: string): Promise<string | null> {
    if (!SecureStorageManager.isSupported()) {
      return null;
    }

    return await SecureStorageManager.getSecure(`${this.API_KEY_PREFIX}${provider}`);
  }

  /**
   * Remove API key
   */
  static removeAPIKey(provider: string): void {
    SecureStorageManager.removeSecure(`${this.API_KEY_PREFIX}${provider}`);
  }

  /**
   * Check if API key exists
   */
  static hasAPIKey(provider: string): boolean {
    return SecureStorageManager.hasSecure(`${this.API_KEY_PREFIX}${provider}`);
  }

  /**
   * Clear all API keys
   */
  static clearAllAPIKeys(): void {
    // Only clear API keys, not other secure data
    const keys = Object.keys(sessionStorage)
      .filter(key => key.startsWith(`${SecureStorageManager['STORAGE_PREFIX']}${this.API_KEY_PREFIX}`));
    
    keys.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Get list of configured providers
   */
  static getConfiguredProviders(): string[] {
    if (!SecureStorageManager.isSupported()) {
      return [];
    }

    return Object.keys(sessionStorage)
      .filter(key => key.startsWith(`${SecureStorageManager['STORAGE_PREFIX']}${this.API_KEY_PREFIX}`))
      .map(key => key.replace(`${SecureStorageManager['STORAGE_PREFIX']}${this.API_KEY_PREFIX}`, ''));
  }

  /**
   * Migrate from localStorage to secure storage
   */
  static async migrateFromLocalStorage(): Promise<void> {
    const localStorageKeys = Object.keys(localStorage)
      .filter(key => key.includes('api') || key.includes('key'));

    for (const key of localStorageKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          // Extract provider name from key
          const provider = key.replace(/.*api.*key.*_?/i, '') || 'unknown';
          await this.setAPIKey(provider, value);
          localStorage.removeItem(key); // Remove from localStorage after successful migration
        } catch (error) {
          console.warn(`Failed to migrate key ${key}:`, error);
        }
      }
    }
  }
}

export default SecureStorageManager;
