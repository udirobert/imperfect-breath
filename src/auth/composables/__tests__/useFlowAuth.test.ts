/**
 * Flow Authentication Tests
 * 
 * Tests for the enhanced Flow authentication with scheduled transactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlowAuthManager } from '../useFlowAuth';

// Mock FCL
const mockFcl = {
  authenticate: vi.fn(),
  unauthenticate: vi.fn(),
  currentUser: {
    subscribe: vi.fn(),
  },
};

// Mock SDK
const mockSdk = {
  send: vi.fn(),
  getNodeVersionInfo: vi.fn(),
  decode: vi.fn(),
};

// Mock imports
vi.mock('@onflow/fcl', () => mockFcl);
vi.mock('@onflow/sdk', () => mockSdk);

describe('FlowAuthManager', () => {
  let flowAuthManager: FlowAuthManager;

  beforeEach(() => {
    flowAuthManager = FlowAuthManager.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = FlowAuthManager.getInstance();
      const instance2 = FlowAuthManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('checkForteCapabilities', () => {
    it('should detect Flow Forte capabilities correctly', async () => {
      mockSdk.send.mockResolvedValue({});
      mockSdk.decode.mockResolvedValue({
        network: {
          name: 'forte-testnet',
          version: '1.0.0',
        },
      });

      // @ts-ignore - Private method access for testing
      await flowAuthManager.checkForteCapabilities();

      // @ts-ignore - Private property access for testing
      const capabilities = flowAuthManager.capabilities;
      expect(capabilities.scheduledTransactions).toBe(true);
      expect(capabilities.flowActions).toBe(true);
      expect(capabilities.webAuthN).toBe(true);
    });

    it('should handle errors when checking capabilities', async () => {
      mockSdk.send.mockRejectedValue(new Error('Network error'));

      // @ts-ignore - Private method access for testing
      await flowAuthManager.checkForteCapabilities();

      // @ts-ignore - Private property access for testing
      const capabilities = flowAuthManager.capabilities;
      expect(capabilities.scheduledTransactions).toBe(false);
      expect(capabilities.flowActions).toBe(false);
      expect(capabilities.webAuthN).toBe(false);
    });
  });

  describe('scheduleTransaction', () => {
    it('should schedule a transaction when capabilities are available', async () => {
      // @ts-ignore - Private property access for testing
      flowAuthManager.capabilities = {
        scheduledTransactions: true,
        flowActions: false,
        webAuthN: false,
      };

      const mockTransaction = {
        script: 'transaction { execute { log("Hello World") } }',
        args: [],
      };

      const result = await flowAuthManager.scheduleTransaction(
        mockTransaction,
        new Date(Date.now() + 3600000) // 1 hour from now
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
    });

    it('should return error when scheduled transactions are not supported', async () => {
      // @ts-ignore - Private property access for testing
      flowAuthManager.capabilities = {
        scheduledTransactions: false,
        flowActions: false,
        webAuthN: false,
      };

      const mockTransaction = {
        script: 'transaction { execute { log("Hello World") } }',
        args: [],
      };

      const result = await flowAuthManager.scheduleTransaction(
        mockTransaction,
        new Date(Date.now() + 3600000) // 1 hour from now
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Scheduled transactions not supported on this network');
    });
  });

  describe('getScheduledTransactions', () => {
    it('should return scheduled transactions when capabilities are available', async () => {
      // @ts-ignore - Private property access for testing
      flowAuthManager.capabilities = {
        scheduledTransactions: true,
        flowActions: false,
        webAuthN: false,
      };

      const result = await flowAuthManager.getScheduledTransactions();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.transactions)).toBe(true);
    });

    it('should return error when scheduled transactions are not supported', async () => {
      // @ts-ignore - Private property access for testing
      flowAuthManager.capabilities = {
        scheduledTransactions: false,
        flowActions: false,
        webAuthN: false,
      };

      const result = await flowAuthManager.getScheduledTransactions();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Scheduled transactions not supported on this network');
    });
  });

  describe('cancelScheduledTransaction', () => {
    it('should cancel a scheduled transaction when capabilities are available', async () => {
      // @ts-ignore - Private property access for testing
      flowAuthManager.capabilities = {
        scheduledTransactions: true,
        flowActions: false,
        webAuthN: false,
      };

      const result = await flowAuthManager.cancelScheduledTransaction('tx-123');

      expect(result.success).toBe(true);
    });

    it('should return error when scheduled transactions are not supported', async () => {
      // @ts-ignore - Private property access for testing
      flowAuthManager.capabilities = {
        scheduledTransactions: false,
        flowActions: false,
        webAuthN: false,
      };

      const result = await flowAuthManager.cancelScheduledTransaction('tx-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Scheduled transactions not supported on this network');
    });
  });
});