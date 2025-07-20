/**
 * Unified Authentication System - Pure Lens v3 Implementation
 *
 * Progressive authentication flow:
 * 1. Email/Social (Supabase) - Core identity
 * 2. Wallet Connection (Wagmi) - Blockchain access
 * 3. Flow Blockchain - NFT operations
 * 4. Lens Protocol v3 - Social features
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { useFlow } from "./useFlow";
import { useLens } from "./useLens";
import { User, LensAccount } from "../types/blockchain";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export interface UnifiedAuthState {
  // Core Authentication
  isAuthenticated: boolean;
  user: User | null;

  // Blockchain Connections
  walletConnected: boolean;
  walletAddress: string | null;

  // Platform States
  flow: {
    connected: boolean;
    address: string | null;
    canMintNFTs: boolean;
    canPurchase: boolean;
  };

  lens: {
    connected: boolean;
    account: LensAccount | null;
    canPost: boolean;
    canFollow: boolean;
  };

  // Auth Level
  authLevel: "none" | "email" | "wallet" | "full";
  availableFeatures: string[];
}

export const useUnifiedAuth = () => {
  const { user, isAuthenticated, loginWithEmail, signUpWithEmail, logout } =
    useAuth();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Platform hooks
  const flowState = useFlow();
  const lensState = useLens();

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
      account: null,
      canPost: false,
      canFollow: false,
    },
    authLevel: "none",
    availableFeatures: [],
  });

  // Update unified state when dependencies change
  useEffect(() => {
    const flowConnected = flowState.state?.isConnected || false;
    const lensConnected = lensState.isAuthenticated;

    const newAuthLevel = getAuthLevel(
      isAuthenticated,
      isConnected,
      flowConnected,
      lensConnected,
    );

    const newState: UnifiedAuthState = {
      isAuthenticated,
      user:
        isAuthenticated && user
          ? {
              ...user,
              role: user.role || "user",
              creator_verified: user.creator_verified || false,
              wallet_address: address || null,
              updatedAt: user.updatedAt || new Date().toISOString(),
              wallet:
                isConnected && address
                  ? {
                      address,
                      chainId: chain?.id || 1,
                      balance: "0",
                      network: "mainnet",
                      provider: "metamask",
                    }
                  : undefined,
            }
          : null,
      walletConnected: isConnected,
      walletAddress: address || null,

      flow: {
        connected: flowConnected,
        address: flowState.user?.addr || null,
        canMintNFTs: flowConnected && isConnected,
        canPurchase: flowConnected && isConnected,
      },

      lens: {
        connected: lensConnected,
        account: lensState.currentAccount,
        canPost: lensConnected && isConnected,
        canFollow: lensConnected && isConnected,
      },

      authLevel: newAuthLevel,
      availableFeatures: getAvailableFeatures(
        isAuthenticated,
        isConnected,
        flowConnected,
        lensConnected,
      ),
    };

    setAuthState(newState);
  }, [
    isAuthenticated,
    user,
    isConnected,
    address,
    chain?.id,
    flowState.state?.isConnected,
    flowState.user?.addr,
    lensState.isAuthenticated,
    lensState.currentAccount,
  ]);

  // Authentication methods
  const authenticateWithEmail = useCallback(
    async (email: string, password: string, isSignUp = false) => {
      try {
        if (isSignUp) {
          await signUpWithEmail(email, password);
        } else {
          await loginWithEmail(email, password);
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },
    [loginWithEmail, signUpWithEmail],
  );

  const connectWallet = useCallback(
    async (connectorId?: string) => {
      try {
        const connector = connectorId
          ? connectors.find((c) => c.id === connectorId)
          : connectors[0];

        if (connector) {
          connect({ connector });
          return { success: true };
        }
        return { success: false, error: "No wallet connector available" };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    },
    [connect, connectors],
  );

  const connectFlow = useCallback(async () => {
    try {
      if (!isConnected) {
        throw new Error("Wallet must be connected first");
      }
      await flowState.connect();
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [flowState, isConnected]);

  const connectLens = useCallback(async () => {
    try {
      if (!isConnected || !address) {
        throw new Error("Wallet must be connected first");
      }

      const result = await lensState.authenticate(address);
      if (result.success) {
        return { success: true };
      }
      return {
        success: false,
        error: result.error || "Lens authentication failed",
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [lensState, isConnected, address]);

  const disconnectAll = useCallback(async () => {
    try {
      // Disconnect Lens
      if (lensState.isAuthenticated) {
        await lensState.logout();
      }

      // Disconnect Flow
      if (flowState.state?.isConnected) {
        await flowState.disconnect();
      }

      // Disconnect wallet
      if (isConnected) {
        disconnect();
      }

      // Logout from email auth
      await logout();

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }, [logout, disconnect, flowState, lensState, isConnected]);

  // Auto-connect Flow when wallet is ready
  useEffect(() => {
    if (isConnected && isAuthenticated && !flowState.state?.isConnected) {
      connectFlow();
    }
  }, [isConnected, isAuthenticated, flowState.state?.isConnected, connectFlow]);

  return {
    // State
    ...authState,

    // Authentication Methods
    authenticateWithEmail,
    connectWallet,
    connectFlow,
    connectLens,
    disconnectAll,

    // Utility Methods
    canAccessFeature: (feature: string) =>
      authState.availableFeatures.includes(feature),
    getRequiredAuthLevel: (feature: string) => getRequiredAuthLevel(feature),

    // Platform-specific utilities
    flow: {
      ...authState.flow,
      mintNFT: flowState.mintBreathingPattern,
      purchaseNFT: () => Promise.resolve(""),
      getBalance: () => Promise.resolve("0"),
    },

    lens: {
      ...authState.lens,
      createPost: lensState.shareBreathingPattern,
      followProfile: lensState.followAccount,
      getTimeline: () => lensState.timeline,
    },
  };
};

// Helper functions
function getAuthLevel(
  emailAuth: boolean,
  walletConnected: boolean,
  flowConnected: boolean,
  lensConnected: boolean,
): UnifiedAuthState["authLevel"] {
  if (!emailAuth) return "none";
  if (!walletConnected) return "email";
  if (flowConnected && lensConnected) return "full";
  return "wallet";
}

function getAvailableFeatures(
  emailAuth: boolean,
  walletConnected: boolean,
  flowConnected: boolean,
  lensConnected: boolean,
): string[] {
  const features: string[] = [];

  if (emailAuth) {
    features.push(
      "breathing-sessions",
      "progress-tracking",
      "pattern-favorites",
    );
  }

  if (walletConnected) {
    features.push("wallet-integration");
  }

  if (flowConnected) {
    features.push("nft-minting", "nft-purchasing", "marketplace-selling");
  }

  if (lensConnected) {
    features.push("social-posting", "social-following", "community-features");
  }

  return features;
}

function getRequiredAuthLevel(feature: string): UnifiedAuthState["authLevel"] {
  const featureRequirements: Record<string, UnifiedAuthState["authLevel"]> = {
    "breathing-sessions": "none",
    "progress-tracking": "email",
    "pattern-favorites": "email",
    "wallet-integration": "wallet",
    "nft-minting": "wallet",
    "nft-purchasing": "wallet",
    "marketplace-selling": "wallet",
    "social-posting": "full",
    "social-following": "full",
    "community-features": "full",
    "ip-registration": "full",
    "royalty-earning": "full",
    licensing: "full",
  };

  return featureRequirements[feature] || "full";
}
