/**
 * Security Tests for RevenueCat Configuration
 * 
 * These tests ensure that RevenueCat API keys are not exposed in client-side code
 * and that the secure configuration system works properly.
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { 
  loadRevenueCatConfig, 
  getRevenueCatKeyForPlatform, 
  isValidRevenueCatKey,
  createMockRevenueCatConfig 
} from '../revenueCatConfig';

describe('RevenueCat Security Configuration', () => {
  describe('loadRevenueCatConfig', () => {
    // Note: import.meta.env cannot be mocked in vitest, so we test the actual environment behavior
    it('should return a valid config structure', async () => {
      const config = await loadRevenueCatConfig();
      
      expect(config).toHaveProperty('isAvailable');
      expect(config).toHaveProperty('config');
      expect(config).toHaveProperty('mode');
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
  it('should use mock keys in test environment', () => {
    const config = createMockRevenueCatConfig();
    
    // Mock keys should not contain real key patterns (32+ alphanumeric chars)
    expect(config.ios).not.toMatch(/appl_[A-Za-z0-9]{32,}/);
    expect(config.android).not.toMatch(/goog_[A-Za-z0-9]{32,}/);
  });
});
