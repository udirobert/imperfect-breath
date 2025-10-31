/**
 * RevenueCat Authentication Integration Tests
 * 
 * Tests for the enhanced RevenueCat authentication integration with email support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RevenueCatAuthIntegration } from '../revenueCatAuthIntegration';
import { revenueCatService } from '../revenueCat';

// Mock revenueCatService
const mockRevenueCatService = {
  isRevenueCatAvailable: vi.fn(),
  identifyUser: vi.fn(),
  initialize: vi.fn(),
};

// Mock the actual revenueCatService import
vi.mock('../revenueCat', () => ({
  revenueCatService: mockRevenueCatService,
}));

describe('RevenueCatAuthIntegration', () => {
  let revenueCatAuthIntegration: RevenueCatAuthIntegration;

  beforeEach(() => {
    revenueCatAuthIntegration = RevenueCatAuthIntegration.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = RevenueCatAuthIntegration.getInstance();
      const instance2 = RevenueCatAuthIntegration.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('handleEmailAuth', () => {
    it('should identify user with email authentication', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);
      mockRevenueCatService.identifyUser.mockResolvedValue(undefined);

      await revenueCatAuthIntegration.handleEmailAuth('user-123', 'user@example.com');

      expect(mockRevenueCatService.identifyUser).toHaveBeenCalledWith('user-123', {
        email: 'user@example.com',
        authMethod: 'email',
        platform: expect.any(String),
      });
    });

    it('should handle missing email gracefully', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);
      mockRevenueCatService.identifyUser.mockResolvedValue(undefined);

      await revenueCatAuthIntegration.handleEmailAuth('user-123');

      expect(mockRevenueCatService.identifyUser).toHaveBeenCalledWith('user-123', {
        email: '',
        authMethod: 'email',
        platform: expect.any(String),
      });
    });

    it('should skip identification when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      await revenueCatAuthIntegration.handleEmailAuth('user-123', 'user@example.com');

      expect(mockRevenueCatService.identifyUser).not.toHaveBeenCalled();
    });
  });

  describe('handleSecureEmailAuth', () => {
    it('should identify user with secure email authentication', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);
      mockRevenueCatService.identifyUser.mockResolvedValue(undefined);

      const result = await revenueCatAuthIntegration.handleSecureEmailAuth(
        'user-123',
        'user@example.com',
        'secure-token-1234567890'
      );

      expect(result.success).toBe(true);
      expect(mockRevenueCatService.identifyUser).toHaveBeenCalledWith('user-123', {
        email: 'user@example.com',
        authMethod: 'email',
        platform: expect.any(String),
        secureAuth: 'true',
        token: 'secure-token-1234567890',
      });
    });

    it('should reject invalid secure tokens', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);

      const result = await revenueCatAuthIntegration.handleSecureEmailAuth(
        'user-123',
        'user@example.com',
        'short' // Invalid token (too short)
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid secure token');
      expect(mockRevenueCatService.identifyUser).not.toHaveBeenCalled();
    });

    it('should skip identification when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      const result = await revenueCatAuthIntegration.handleSecureEmailAuth(
        'user-123',
        'user@example.com',
        'secure-token-1234567890'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('RevenueCat not available');
      expect(mockRevenueCatService.identifyUser).not.toHaveBeenCalled();
    });
  });

  describe('handleWalletAuth', () => {
    it('should identify user with wallet authentication', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);
      mockRevenueCatService.identifyUser.mockResolvedValue(undefined);

      const result = await revenueCatAuthIntegration.handleWalletAuth(
        'user-123',
        '0x123456789abcdef',
        1
      );

      expect(result.success).toBe(true);
      expect(mockRevenueCatService.identifyUser).toHaveBeenCalledWith('user-123', {
        walletAddress: '0x123456789abcdef',
        authMethod: 'wallet',
        platform: expect.any(String),
        chainId: '1',
      });
    });

    it('should handle missing chain ID gracefully', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);
      mockRevenueCatService.identifyUser.mockResolvedValue(undefined);

      const result = await revenueCatAuthIntegration.handleWalletAuth(
        'user-123',
        '0x123456789abcdef'
      );

      expect(result.success).toBe(true);
      expect(mockRevenueCatService.identifyUser).toHaveBeenCalledWith('user-123', {
        walletAddress: '0x123456789abcdef',
        authMethod: 'wallet',
        platform: expect.any(String),
        chainId: 'unknown',
      });
    });

    it('should skip identification when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      const result = await revenueCatAuthIntegration.handleWalletAuth(
        'user-123',
        '0x123456789abcdef',
        1
      );

      expect(result.success).toBe(true);
      expect(result.error).toBe('RevenueCat not available');
      expect(mockRevenueCatService.identifyUser).not.toHaveBeenCalled();
    });
  });

  describe('handleLensAuth', () => {
    it('should identify user with Lens authentication', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);
      mockRevenueCatService.identifyUser.mockResolvedValue(undefined);

      const mockProfile = {
        id: 'profile-123',
        handle: 'user.lens',
        ownedBy: '0x123456789abcdef',
      };

      const result = await revenueCatAuthIntegration.handleLensAuth(mockProfile);

      expect(result.success).toBe(true);
      expect(mockRevenueCatService.identifyUser).toHaveBeenCalledWith('profile-123', {
        lensProfileId: 'profile-123',
        lensHandle: 'user.lens',
        lensOwner: '0x123456789abcdef',
        authMethod: 'lens',
        platform: expect.any(String),
      });
    });

    it('should skip identification when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      const mockProfile = {
        id: 'profile-123',
        handle: 'user.lens',
        ownedBy: '0x123456789abcdef',
      };

      const result = await revenueCatAuthIntegration.handleLensAuth(mockProfile);

      expect(result.success).toBe(true);
      expect(result.error).toBe('RevenueCat not available');
      expect(mockRevenueCatService.identifyUser).not.toHaveBeenCalled();
    });
  });

  describe('handleFlowAuth', () => {
    it('should identify user with Flow authentication', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);
      mockRevenueCatService.identifyUser.mockResolvedValue(undefined);

      const result = await revenueCatAuthIntegration.handleFlowAuth(
        'user-123',
        '0x123456789abcdef'
      );

      expect(result.success).toBe(true);
      expect(mockRevenueCatService.identifyUser).toHaveBeenCalledWith('user-123', {
        flowAddress: '0x123456789abcdef',
        authMethod: 'flow',
        platform: expect.any(String),
      });
    });

    it('should skip identification when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      const result = await revenueCatAuthIntegration.handleFlowAuth(
        'user-123',
        '0x123456789abcdef'
      );

      expect(result.success).toBe(true);
      expect(result.error).toBe('RevenueCat not available');
      expect(mockRevenueCatService.identifyUser).not.toHaveBeenCalled();
    });
  });

  describe('handleLogout', () => {
    it('should handle user logout', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);

      const result = await revenueCatAuthIntegration.handleLogout();

      expect(result.success).toBe(true);
    });

    it('should handle logout when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      const result = await revenueCatAuthIntegration.handleLogout();

      expect(result.success).toBe(true);
      expect(result.error).toBe('RevenueCat not available');
    });
  });

  describe('setDeveloperOverride', () => {
    it('should set developer override for testing', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);

      const result = await revenueCatAuthIntegration.setDeveloperOverride('premium', [
        'ai_analysis',
        'cloud_sync',
      ]);

      expect(result.success).toBe(true);
    });

    it('should handle developer override when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      const result = await revenueCatAuthIntegration.setDeveloperOverride('premium');

      expect(result.success).toBe(true);
      expect(result.error).toBe('RevenueCat not available');
    });
  });

  describe('clearDeveloperOverride', () => {
    it('should clear developer override', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(true);

      const result = await revenueCatAuthIntegration.clearDeveloperOverride();

      expect(result.success).toBe(true);
    });

    it('should handle clearing developer override when RevenueCat is not available', async () => {
      mockRevenueCatService.isRevenueCatAvailable.mockReturnValue(false);

      const result = await revenueCatAuthIntegration.clearDeveloperOverride();

      expect(result.success).toBe(true);
      expect(result.error).toBe('RevenueCat not available');
    });
  });

  describe('getPlatform', () => {
    it('should detect Capacitor platform', () => {
      // Mock window.Capacitor
      const originalWindow = { ...window };
      // @ts-ignore
      window.Capacitor = {
        getPlatform: vi.fn().mockReturnValue('ios'),
      };

      // @ts-ignore - Private method access for testing
      const platform = revenueCatAuthIntegration.getPlatform();

      expect(platform).toBe('ios');
      // @ts-ignore
      window.Capacitor = originalWindow.Capacitor;
    });

    it('should default to web when no platform is detected', () => {
      // Mock window without Capacitor
      const originalWindow = { ...window };
      // @ts-ignore
      delete window.Capacitor;

      // @ts-ignore - Private method access for testing
      const platform = revenueCatAuthIntegration.getPlatform();

      expect(platform).toBe('web');
      // @ts-ignore
      window = originalWindow;
    });

    it('should handle server-side rendering', () => {
      // Mock server-side environment
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      // @ts-ignore - Private method access for testing
      const platform = revenueCatAuthIntegration.getPlatform();

      expect(platform).toBe('server');
      global.window = originalWindow;
    });
  });
});