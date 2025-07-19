import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useFlow } from "./useFlow";
import { useLens } from "./useLens";
import { useStory } from "./useStory";
import { useAccount, useConnect, useDisconnect } from "wagmi";

/**
 * Unified authentication system that progressively connects users across all platforms
 * 
 * Authentication Flow:
 * 1. Email/Social (Supabase) - Core identity and progress tracking
 * 2. Wallet Connection (Wagmi) - Enables blockchain features
 * 3. Flow Blockchain - NFT minting and marketplace transactions
 * 4. Lens Protocol - Decentralized social features
 * 5. Story Protocol - IP rights and royalty management
 */

export interface UnifiedAuthState {
  // Core Authentication
  isAuthenticated: boolean;
  user: any;
  
  // Blockchain Connections
  walletConnected: boolean;
  walletAddress: string | null;
  
  // Platform-Specific States
  flow: {
    connected: boolean;
    address: string | null;
    canMintNFTs: boolean;
    canPurchase: boolean;
  };
  
  lens: {
    connected: boolean;
    profile: any;
    canPost: boolean;
    canFollow: boolean;
  };
  
  story: {
    connected: boolean;
    canRegisterIP: boolean;
    canEarnRoyalties: boolean;
  };
  
  // Progressive Enhancement Levels
  authLevel: 'none' | 'email' | 'wallet' | 'full';
  availableFeatures: string[];
}

export const useUnifiedAuth = () => {
  const { user, isAuthenticated, loginWithEmail, signUpWithEmail, logout } = useAuth();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Blockchain hooks
  const flowState = useFlow();
  const lensState = useLens();
  const storyState = useStory();
  
  const [authState, setAuthState] = useState<UnifiedAuthState>({
    isAuthenticated: false,
    user: null,
    walletConnected: false,
    walletAddress: null,
    flow: {
      connected: false,
      address: null,
      canMintNFTs: false,
      canPurchase: false,
    },
    lens: {
      connected: false,
      profile: null,
      canPost: false,
      canFollow: false,
    },
    story: {
      connected: false,
      canRegisterIP: false,
      canEarnRoyalties: false,
    },
    authLevel: 'none',
    availableFeatures: [],
  });

  // Update auth state when dependencies change
  useEffect(() => {
    const newState: UnifiedAuthState = {
      isAuthenticated,
      user,
      walletConnected: isConnected,
      walletAddress: address || null,
      
      flow: {
        connected: flowState.isConnected,
        address: flowState.address,
        canMintNFTs: flowState.isConnected && isConnected,
        canPurchase: flowState.isConnected && isConnected,
      },
      
      lens: {
        connected: lensState.isAuthenticated,
        profile: lensState.currentAccount,
        canPost: lensState.isAuthenticated && isConnected,
        canFollow: lensState.isAuthenticated && isConnected,
      },
      
      story: {
        connected: storyState.isConnected,
        canRegisterIP: storyState.isConnected && isConnected,
        canEarnRoyalties: storyState.isConnected && isConnected,
      },
      
      authLevel: getAuthLevel(isAuthenticated, isConnected, flowState.isConnected, lensState.isAuthenticated, storyState.isConnected),
      availableFeatures: getAvailableFeatures(isAuthenticated, isConnected, flowState.isConnected, lensState.isAuthenticated, storyState.isConnected),
    };
    
    setAuthState(newState);
  }, [
    isAuthenticated, 
    user, 
    isConnected, 
    address,
    flowState.isConnected,
    flowState.address,
    lensState.isAuthenticated,
    lensState.currentAccount,
    storyState.isConnected
  ]);

  // Progressive authentication methods
  const authenticateWithEmail = useCallback(async (email: string, password: string, isSignUp = false) => {
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [loginWithEmail, signUpWithEmail]);

  const connectWallet = useCallback(async (connectorId?: string) => {
    try {
      const connector = connectorId 
        ? connectors.find(c => c.id === connectorId)
        : connectors[0]; // Default to first available
        
      if (connector) {
        connect({ connector });
        return { success: true };
      }
      return { success: false, error: "No wallet connector available" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [connect, connectors]);

  const connectFlow = useCallback(async () => {
    try {
      if (!isConnected) {
        throw new Error("Wallet must be connected first");
      }
      await flowState.connect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [flowState.connect, isConnected]);

  const connectLens = useCallback(async () => {
    try {
      if (!isConnected) {
        throw new Error("Wallet must be connected first");
      }
      await lensState.authenticate();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [lensState.authenticate, isConnected]);

  const connectStory = useCallback(async () => {
    try {
      if (!isConnected) {
        throw new Error("Wallet must be connected first");
      }
      await storyState.connect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [storyState.connect, isConnected]);

  const disconnectAll = useCallback(async () => {
    try {
      // Disconnect blockchain connections first
      if (storyState.isConnected) {
        await storyState.disconnect();
      }
      if (lensState.isAuthenticated) {
        await lensState.logout();
      }
      if (flowState.isConnected) {
        await flowState.disconnect();
      }
      
      // Disconnect wallet
      if (isConnected) {
        disconnect();
      }
      
      // Finally logout from email auth
      await logout();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [logout, disconnect, flowState, lensState, storyState, isConnected]);

  // Auto-connect blockchain services when wallet is connected
  useEffect(() => {
    if (isConnected && isAuthenticated) {
      // Auto-connect Flow for NFT capabilities
      if (!flowState.isConnected) {
        connectFlow();
      }
    }
  }, [isConnected, isAuthenticated, flowState.isConnected, connectFlow]);

  return {
    // State
    ...authState,
    
    // Authentication Methods
    authenticateWithEmail,
    connectWallet,
    connectFlow,
    connectLens,
    connectStory,
    disconnectAll,
    
    // Utility Methods
    canAccessFeature: (feature: string) => authState.availableFeatures.includes(feature),
    getRequiredAuthLevel: (feature: string) => getRequiredAuthLevel(feature),
    
    // Blockchain-specific utilities
    flow: {
      ...authState.flow,
      mintNFT: flowState.mintNFT,
      purchaseNFT: flowState.purchaseNFT,
      getBalance: flowState.getBalance,
    },
    
    lens: {
      ...authState.lens,
      createPost: lensState.createPost,
      followProfile: lensState.followProfile,
      getTimeline: lensState.getTimeline,
    },
    
    story: {
      ...authState.story,
      registerIP: storyState.registerIP,
      createLicense: storyState.createLicense,
      claimRoyalties: storyState.claimRoyalties,
    },
  };
};

// Helper functions
function getAuthLevel(
  emailAuth: boolean,
  walletConnected: boolean,
  flowConnected: boolean,
  lensConnected: boolean,
  storyConnected: boolean
): UnifiedAuthState['authLevel'] {
  if (!emailAuth) return 'none';
  if (!walletConnected) return 'email';
  if (flowConnected && (lensConnected || storyConnected)) return 'full';
  return 'wallet';
}

function getAvailableFeatures(
  emailAuth: boolean,
  walletConnected: boolean,
  flowConnected: boolean,
  lensConnected: boolean,
  storyConnected: boolean
): string[] {
  const features: string[] = [];
  
  // Email auth features
  if (emailAuth) {
    features.push('breathing-sessions', 'progress-tracking', 'pattern-favorites');
  }
  
  // Wallet features
  if (walletConnected) {
    features.push('wallet-integration');
  }
  
  // Flow blockchain features (NFTs & Marketplace)
  if (flowConnected) {
    features.push('nft-minting', 'nft-purchasing', 'marketplace-selling');
  }
  
  // Lens Protocol features (Social)
  if (lensConnected) {
    features.push('social-posting', 'social-following', 'community-features');
  }
  
  // Story Protocol features (IP & Royalties)
  if (storyConnected) {
    features.push('ip-registration', 'royalty-earning', 'licensing');
  }
  
  return features;
}

function getRequiredAuthLevel(feature: string): UnifiedAuthState['authLevel'] {
  const featureRequirements: Record<string, UnifiedAuthState['authLevel']> = {
    'breathing-sessions': 'none', // Available to everyone
    'progress-tracking': 'email',
    'pattern-favorites': 'email',
    'wallet-integration': 'wallet',
    'nft-minting': 'wallet',
    'nft-purchasing': 'wallet',
    'marketplace-selling': 'wallet',
    'social-posting': 'full',
    'social-following': 'full',
    'community-features': 'full',
    'ip-registration': 'full',
    'royalty-earning': 'full',
    'licensing': 'full',
  };
  
  return featureRequirements[feature] || 'full';
}