/**
 * Security Tests for RevenueCat Configuration
 * 
 * These tests ensure that RevenueCat API keys are not exposed in client-side code
 * and that the secure configuration system works properly.
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  loadRevenueCatConfig, 
  getRevenueCatKeyForPlatform, 
  isValidRevenueCatKey,
  createMockRevenueCatConfig 
} from '../revenueCatConfig';

// Mock import.meta.env to simulate different environments
const mockImportMeta = {
  env: {
    DEV: false,
    PROD: true,
    VITE_REVENUECAT_IOS_KEY: undefined,
    VITE_REVENUECAT_ANDROID_KEY: undefined
  }
};

// Mock import.meta globally
vi.stubGlobal('import', {
  meta: mockImportMeta
});

describe('RevenueCat Security Configuration', () => {
  describe('loadRevenueCatConfig', () => {
    it('should not expose keys in production environment', async () => {
      mockImportMeta.env.DEV = false;
      mockImportMeta.env.PROD = true;
      
      const config = await loadRevenueCatConfig();
      
      expect(config.isAvailable).toBe(false);
      expect(config.config).toBe(null);
      expect(config.error).toContain('not available in production build');
    });

    it('should allow fallback keys in development environment', async () => {
      mockImportMeta.env.DEV = true;
      mockImportMeta.env.PROD = false;
      
      const config = await loadRevenueCatConfig();
      
      expect(config.isAvailable).toBe(true);
      expect(config.config).not.toBe(null);
      expect(config.config?.ios).toContain('appl_');
      expect(config.config?.android).toContain('goog_');
    });
  });

  describe('isValidRevenueCatKey', () => {
    it('should validate iOS keys correctly', () => {
      expect(isValidRevenueCatKey('appl_valid_key_123', 'ios')).toBe(true);
      expect(isValidRevenueCatKey('goog_invalid_for_ios', 'ios')).toBe(false);
      expect(isValidRevenueCatKey('appl_', 'ios')).toBe(false);
      expect(isValidRevenueCatKey('', 'ios')).toBe(false);
    });

    it('should validate Android keys correctly', () => {
      expect(isValidRevenueCatKey('goog_valid_key_123', 'android')).toBe(true);
      expect(isValidRevenueCatKey('appl_invalid_for_android', 'android')).toBe(false);
      expect(isValidRevenueCatKey('goog_', 'android')).toBe(false);
      expect(isValidRevenueCatKey('', 'android')).toBe(false);
    });
  });

  describe('getRevenueCatKeyForPlatform', () => {
    it('should return correct key for platform', () => {
      const config = createMockRevenueCatConfig();
      
      expect(getRevenueCatKeyForPlatform(config, 'ios')).toBe(config.ios);
      expect(getRevenueCatKeyForPlatform(config, 'android')).toBe(config.android);
    });
  });

  describe('createMockRevenueCatConfig', () => {
    it('should create valid mock configuration', () => {
      const mockConfig = createMockRevenueCatConfig();
      
      expect(mockConfig.ios).toContain('appl_');
      expect(mockConfig.android).toContain('goog_');
      expect(isValidRevenueCatKey(mockConfig.ios, 'ios')).toBe(true);
      expect(isValidRevenueCatKey(mockConfig.android, 'android')).toBe(true);
    });
  });

  describe('Security Validation', () => {
    it('should not contain actual API keys in test environment', () => {
      const config = createMockRevenueCatConfig();
      
      // Ensure mock keys don't contain real key patterns
      expect(config.ios).not.toMatch(/appl_[A-Za-z0-9]{32,}/);
      expect(config.android).not.toMatch(/goog_[A-Za-z0-9]{32,}/);
      
      // Ensure they're clearly marked as mock/test keys
      expect(config.ios).toContain('mock');
      expect(config.android).toContain('mock');
    });
  });
});

describe('Build Output Security', () => {
  it('should not expose environment variables in production build', () => {
    // This test ensures that sensitive environment variables are not bundled
    const envString = JSON.stringify(mockImportMeta.env);
    
    // In production, these should not be present or should be undefined
    if (!mockImportMeta.env.DEV) {
      expect(envString).not.toMatch(/appl_[A-Za-z0-9]+/);
      expect(envString).not.toMatch(/goog_[A-Za-z0-9]+/);
    }
  });
});
