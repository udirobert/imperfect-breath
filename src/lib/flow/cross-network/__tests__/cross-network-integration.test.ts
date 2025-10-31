/**
 * Cross-Network Integration Tests
 * 
 * Tests for the cross-network integration between Flow Forte and Lens Protocol
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CrossNetworkIntegration } from '../cross-network-integration';

// Mock the Lens API
const mockLensAPI = {
  createPost: vi.fn(),
};

// Mock the Flow NFT client
const mockFlowNFTClient = {
  mintNFT: vi.fn(),
  purchaseNFT: vi.fn(),
};

// Mock imports
vi.mock('../../../lib/lens', () => ({
  lensAPI: mockLensAPI,
}));

vi.mock('../clients/forte-nft-client', () => ({
  ForteNFTClient: mockFlowNFTClient,
}));

describe('CrossNetworkIntegration', () => {
  let crossNetworkIntegration: CrossNetworkIntegration;

  beforeEach(() => {
    crossNetworkIntegration = new CrossNetworkIntegration();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('postMintToLens', () => {
    it('should create a social post when an NFT is minted', async () => {
      const mockNFT = {
        id: 'nft-123',
        name: 'Relaxation Pattern',
        description: 'A calming breathing pattern',
        image: 'https://example.com/image.png',
        attributes: {
          inhale: 4,
          hold: 7,
          exhale: 8,
          rest: 0,
          difficulty: 'intermediate',
          category: 'relaxation',
          tags: ['calm', 'sleep'],
          totalCycles: 5,
          estimatedDuration: 300,
        },
        owner: '0x123456789abcdef',
        creator: '0x123456789abcdef',
        royalties: [],
        metadata: {},
      };

      const mockResult = {
        success: true,
        data: {
          id: 'post-456',
        },
      };

      mockLensAPI.createPost.mockResolvedValue(mockResult);

      const result = await crossNetworkIntegration.postMintToLens({
        nft: mockNFT,
        transactionId: 'tx-789',
        uniqueId: 'unique-123',
        creatorAddress: '0x123456789abcdef',
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('post-456');
      expect(mockLensAPI.createPost).toHaveBeenCalled();
    });

    it('should handle errors when posting to Lens fails', async () => {
      const mockNFT = {
        id: 'nft-123',
        name: 'Relaxation Pattern',
        description: 'A calming breathing pattern',
        image: 'https://example.com/image.png',
        attributes: {
          inhale: 4,
          hold: 7,
          exhale: 8,
          rest: 0,
          difficulty: 'intermediate',
          category: 'relaxation',
          tags: ['calm', 'sleep'],
          totalCycles: 5,
          estimatedDuration: 300,
        },
        owner: '0x123456789abcdef',
        creator: '0x123456789abcdef',
        royalties: [],
        metadata: {},
      };

      const mockResult = {
        success: false,
        error: 'Failed to create post',
      };

      mockLensAPI.createPost.mockResolvedValue(mockResult);

      const result = await crossNetworkIntegration.postMintToLens({
        nft: mockNFT,
        transactionId: 'tx-789',
        uniqueId: 'unique-123',
        creatorAddress: '0x123456789abcdef',
      });

      expect(result).toBeNull();
    });
  });

  describe('postPurchaseToLens', () => {
    it('should create a social post when an NFT is purchased', async () => {
      const mockNFT = {
        id: 'nft-123',
        name: 'Relaxation Pattern',
        description: 'A calming breathing pattern',
        image: 'https://example.com/image.png',
        attributes: {
          inhale: 4,
          hold: 7,
          exhale: 8,
          rest: 0,
          difficulty: 'intermediate',
          category: 'relaxation',
          tags: ['calm', 'sleep'],
          totalCycles: 5,
          estimatedDuration: 300,
        },
        owner: '0x123456789abcdef',
        creator: '0x987654321fedcba',
        royalties: [],
        metadata: {},
      };

      const mockResult = {
        success: true,
        data: {
          id: 'post-456',
        },
      };

      mockLensAPI.createPost.mockResolvedValue(mockResult);

      const result = await crossNetworkIntegration.postPurchaseToLens({
        nft: mockNFT,
        transactionId: 'tx-789',
        uniqueId: 'unique-123',
        buyerAddress: '0x123456789abcdef',
        price: 10,
      });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('post-456');
      expect(mockLensAPI.createPost).toHaveBeenCalled();
    });

    it('should handle errors when posting to Lens fails', async () => {
      const mockNFT = {
        id: 'nft-123',
        name: 'Relaxation Pattern',
        description: 'A calming breathing pattern',
        image: 'https://example.com/image.png',
        attributes: {
          inhale: 4,
          hold: 7,
          exhale: 8,
          rest: 0,
          difficulty: 'intermediate',
          category: 'relaxation',
          tags: ['calm', 'sleep'],
          totalCycles: 5,
          estimatedDuration: 300,
        },
        owner: '0x123456789abcdef',
        creator: '0x987654321fedcba',
        royalties: [],
        metadata: {},
      };

      const mockResult = {
        success: false,
        error: 'Failed to create post',
      };

      mockLensAPI.createPost.mockResolvedValue(mockResult);

      const result = await crossNetworkIntegration.postPurchaseToLens({
        nft: mockNFT,
        transactionId: 'tx-789',
        uniqueId: 'unique-123',
        buyerAddress: '0x123456789abcdef',
        price: 10,
      });

      expect(result).toBeNull();
    });
  });

  describe('executeForteWithLensIntegration', () => {
    it('should execute Flow Forte actions and create Lens posts', async () => {
      const mockActions = [
        {
          type: 'mint' as const,
          params: { patternId: 'pattern-123' },
        },
      ];

      const mockNFT = {
        id: 'nft-123',
        name: 'Relaxation Pattern',
        description: 'A calming breathing pattern',
        image: 'https://example.com/image.png',
        attributes: {
          inhale: 4,
          hold: 7,
          exhale: 8,
          rest: 0,
          difficulty: 'intermediate',
          category: 'relaxation',
          tags: ['calm', 'sleep'],
          totalCycles: 5,
          estimatedDuration: 300,
        },
        owner: '0x123456789abcdef',
        creator: '0x123456789abcdef',
        royalties: [],
        metadata: {},
      };

      const mockForteResult = {
        success: true,
        data: {
          transactionId: 'forte-tx-456',
        },
      };

      const mockLensResult = {
        success: true,
        data: {
          id: 'lens-post-789',
        },
      };

      mockLensAPI.createPost.mockResolvedValue(mockLensResult);

      const result = await crossNetworkIntegration.executeForteWithLensIntegration(
        mockActions,
        'mint',
        mockNFT
      );

      expect(result.forteResult).toBeDefined();
      expect(result.lensPost).not.toBeNull();
    });
  });

  describe('createSocialBreathingChallenge', () => {
    it('should create a social breathing challenge with announcements', async () => {
      const mockPayload = {
        challengeName: '7-Day Mindfulness Challenge',
        patternId: 'pattern-123',
        participants: ['0x123', '0x456'],
        duration: 7,
        rewards: {
          nftId: 'reward-nft-789',
          uniqueId: 'unique-reward-123',
        },
      };

      const mockForteResult = {
        success: true,
        data: {
          challengeId: 'challenge-456',
        },
      };

      const mockLensResult = {
        success: true,
        data: {
          id: 'lens-post-789',
        },
      };

      mockLensAPI.createPost.mockResolvedValue(mockLensResult);

      const result = await crossNetworkIntegration.createSocialBreathingChallenge(mockPayload);

      expect(result.challengeId).toBeDefined();
      expect(result.forteResult).toBeDefined();
      expect(result.lensAnnouncement).toBeDefined();
      expect(result.lensAnnouncement.id).toBe('lens-post-789');
    });
  });
});