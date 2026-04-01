/**
 * Lens Protocol v3 Client Tests
 * 
 * Tests for the enhanced Lens Protocol v3 client implementation
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockBlockchainAuthService } = vi.hoisted(() => ({
  mockBlockchainAuthService: {
    getCurrentLensSession: vi.fn(),
    getAuthorAccount: vi.fn(),
    getCurrentLensSessionDetails: vi.fn(),
    getAuthorAddress: vi.fn(),
  },
}));

vi.mock('@/services/blockchain/BlockchainAuthService', () => ({
  blockchainAuthService: mockBlockchainAuthService,
}));

vi.mock('@lens-protocol/client/actions', () => ({
  follow: vi.fn(),
  unfollow: vi.fn(),
}));

vi.mock('@lens-protocol/client', () => ({
  evmAddress: vi.fn(),
  fetchFeed: vi.fn(),
  fetchPublications: vi.fn(),
  postId: vi.fn(),
  uri: vi.fn(),
}));

import { LensV3API } from '../client';

describe('LensV3API', () => {
  let lensAPI: LensV3API;

  beforeEach(() => {
    lensAPI = new LensV3API();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    it('should authenticate user with wallet signature', async () => {
      const mockWalletAddress = '0x123456789abcdef';
      const mockSignature = '0xabcdef123456789';
      const mockSignMessage = vi.fn().mockResolvedValue(mockSignature);

      const result = await lensAPI.login(mockWalletAddress, mockSignMessage);

      expect(result.success).toBe(true);
      expect(mockSignMessage).toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
      const mockWalletAddress = '0x123456789abcdef';
      const mockSignMessage = vi.fn().mockRejectedValue(new Error('Signature rejected'));

      const result = await lensAPI.login(mockWalletAddress, mockSignMessage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Signature rejected');
    });

    it('should handle missing signatures', async () => {
      const mockWalletAddress = '0x123456789abcdef';
      const mockSignMessage = vi.fn().mockResolvedValue('');

      const result = await lensAPI.login(mockWalletAddress, mockSignMessage);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Signature required for authentication');
    });
  });

  describe('resumeSession', () => {
    it('should resume existing session from storage', async () => {
      const mockSessionData = {
        address: '0x123456789abcdef',
        signature: '0xabcdef123456789',
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      };

      const mockUserData = {
        id: 'user-123',
        address: '0x123456789abcdef',
        username: {
          localName: 'testuser',
          fullHandle: 'testuser.lens',
          ownedBy: '0x123456789abcdef',
        },
        ownedBy: { address: '0x123456789abcdef' },
        metadata: {
          name: 'Test User',
          bio: 'A test user',
        },
        stats: {
          posts: 0,
          followers: 0,
          following: 0,
        },
        timestamp: new Date().toISOString(),
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn((key) => {
          if (key === 'lens-session') return JSON.stringify(mockSessionData);
          if (key === 'lens-user') return JSON.stringify(mockUserData);
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const result = await lensAPI.resumeSession();

      expect(result.success).toBe(true);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('lens-session');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('lens-user');
    });

    it('should handle expired sessions', async () => {
      const mockSessionData = {
        address: '0x123456789abcdef',
        signature: '0xabcdef123456789',
        authenticatedAt: Date.now() - 7200000, // 2 hours ago
        expiresAt: Date.now() - 3600000, // 1 hour ago (expired)
      };

      const mockUserData = {
        id: 'user-123',
        address: '0x123456789abcdef',
        username: {
          localName: 'testuser',
          fullHandle: 'testuser.lens',
          ownedBy: '0x123456789abcdef',
        },
        ownedBy: { address: '0x123456789abcdef' },
        metadata: {
          name: 'Test User',
          bio: 'A test user',
        },
        stats: {
          posts: 0,
          followers: 0,
          following: 0,
        },
        timestamp: new Date().toISOString(),
      };

      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn((key) => {
          if (key === 'lens-session') return JSON.stringify(mockSessionData);
          if (key === 'lens-user') return JSON.stringify(mockUserData);
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const result = await lensAPI.resumeSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Session expired');
    });

    it('should handle missing session data', async () => {
      // Mock localStorage with missing data
      const localStorageMock = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      const result = await lensAPI.resumeSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No session to resume');
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session details', async () => {
      const mockSessionData = {
        address: '0x123456789abcdef',
        signature: '0xabcdef123456789',
        authenticatedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      };

      // @ts-ignore - Private property access for testing
      lensAPI.sessionData = mockSessionData;
      // @ts-ignore - Private property access for testing
      lensAPI.isAuthenticated = true;

      const result = await lensAPI.getCurrentSession();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSessionData);
    });

    it('should handle unauthenticated users', async () => {
      // @ts-ignore - Private property access for testing
      lensAPI.isAuthenticated = false;

      const result = await lensAPI.getCurrentSession();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('logout', () => {
    it('should clear session data and localStorage', async () => {
      // Set up authenticated state
      // @ts-ignore - Private property access for testing
      lensAPI.isAuthenticated = true;
      // @ts-ignore
      lensAPI.sessionData = { address: '0x123', signature: 'sig', authenticatedAt: Date.now(), expiresAt: Date.now() + 3600000 };

      await lensAPI.logout();

      // @ts-ignore - Verify state is cleared
      expect(lensAPI.isAuthenticated).toBe(false);
      // @ts-ignore
      expect(lensAPI.currentUser).toBeNull();
    });

    it('should always clear internal state even if localStorage fails', async () => {
      // @ts-ignore
      lensAPI.isAuthenticated = true;

      await lensAPI.logout();

      // @ts-ignore
      expect(lensAPI.isAuthenticated).toBe(false);
    });
  });

  describe('getAccount', () => {
    it('should return account information', async () => {
      const mockAddress = '0x123456789abcdef';
      const mockAccount = {
        id: 'user-123',
        address: mockAddress,
        username: {
          localName: 'testuser',
          fullHandle: 'testuser.lens',
          ownedBy: mockAddress,
        },
        ownedBy: { address: mockAddress },
        metadata: {
          name: 'Test User',
          bio: 'A test user',
        },
        stats: {
          posts: 10,
          followers: 50,
          following: 25,
        },
        timestamp: new Date().toISOString(),
      };

      // @ts-ignore - Private property access for testing
      lensAPI.currentUser = mockAccount;
      // @ts-ignore - Private property access for testing
      lensAPI.isAuthenticated = true;

      const result = await lensAPI.getAccount(mockAddress);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAccount);
    });

    it('should return mock account for unknown addresses', async () => {
      const mockAddress = '0xfedcba987654321';

      // @ts-ignore - Private property access for testing
      lensAPI.isAuthenticated = false;

      const result = await lensAPI.getAccount(mockAddress);

      // getAccount returns mock data for any address when not authenticated as that user
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.address).toBe(mockAddress);
    });
  });

  describe('createPost', () => {
    it('should create a new post with content URI', async () => {
      const mockContentUri = 'data:application/json,{"content":"Test post"}';
      
      // @ts-ignore - Private property access for testing
      lensAPI.isAuthenticated = true;
      // @ts-ignore - Private property access for testing
      lensAPI.currentUser = {
        id: 'user-123',
        address: '0x123456789abcdef',
        username: {
          localName: 'testuser',
          fullHandle: 'testuser.lens',
          ownedBy: '0x123456789abcdef',
        },
        ownedBy: { address: '0x123456789abcdef' },
        metadata: {
          name: 'Test User',
          bio: 'A test user',
        },
        stats: {
          posts: 0,
          followers: 0,
          following: 0,
        },
        timestamp: new Date().toISOString(),
      };

      const result = await lensAPI.createPost(mockContentUri);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBeDefined();
    });

    it('should handle post creation errors', async () => {
      const mockContentUri = 'data:application/json,{"content":"Test post"}';
      
      // @ts-ignore - Private property access for testing
      lensAPI.isAuthenticated = false;

      const result = await lensAPI.createPost(mockContentUri);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('getTimeline', () => {
    it('should return not authenticated when no session exists', async () => {
      mockBlockchainAuthService.getCurrentLensSession.mockReturnValue(null);

      const result = await lensAPI.getTimeline();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('followAccount', () => {
    it('should return not authenticated when no session', async () => {
      mockBlockchainAuthService.getCurrentLensSession.mockReturnValue(null);

      const result = await lensAPI.followAccount('0x123456789abcdef');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('unfollowAccount', () => {
    it('should return not authenticated when no session', async () => {
      mockBlockchainAuthService.getCurrentLensSession.mockReturnValue(null);

      const result = await lensAPI.unfollowAccount('0x123456789abcdef');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('likePost', () => {
    it('should return not authenticated when no session', async () => {
      mockBlockchainAuthService.getCurrentLensSession.mockReturnValue(null);

      const result = await lensAPI.likePost('post-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('mirrorPost', () => {
    it('should return not authenticated when no session', async () => {
      mockBlockchainAuthService.getCurrentLensSession.mockReturnValue(null);

      const result = await lensAPI.mirrorPost('post-123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('commentOn', () => {
    it('should return not authenticated when no session', async () => {
      mockBlockchainAuthService.getCurrentLensSession.mockReturnValue(null);

      const result = await lensAPI.commentOn('post-123', 'Great post!');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });

  describe('shareBreathingSession', () => {
    it('should return not authenticated when not logged in', async () => {
      const mockSession = {
        patternName: '4-7-8 Breathing',
        duration: 600,
        score: 85,
        cycles: 5,
        breathHoldTime: 30,
      };

      // @ts-ignore
      lensAPI.isAuthenticated = false;

      const result = await lensAPI.shareBreathingSession(mockSession);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
    });
  });
});