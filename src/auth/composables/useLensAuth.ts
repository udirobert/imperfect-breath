import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";

// Lens auth state interface
interface LensProfile {
  id: string;
  handle: string;
  ownedBy: string;
  name?: string;
  bio?: string;
  picture?: {
    original?: {
      url: string;
    };
  };
}

interface LensAuthState {
  profile: LensProfile | null;
  isLoading: boolean;
  error: string | null;
}

export const useLensAuth = () => {
  const { address, isConnected } = useAccount();
  const [lensState, setLensState] = useState<LensAuthState>({
    profile: null,
    isLoading: false,
    error: null,
  });

  // Check for Lens profile when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      checkLensProfile(address);
    } else {
      setLensState({
        profile: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isConnected, address]);

  const checkLensProfile = useCallback(async (walletAddress: string) => {
    setLensState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Replace with actual Lens API call
      // This is a placeholder for Lens profile lookup
      const mockProfile: LensProfile = {
        id: "0x01",
        handle: "user.lens",
        ownedBy: walletAddress,
        name: "Lens User",
        bio: "Web3 enthusiast",
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setLensState({
        profile: mockProfile,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to fetch Lens profile:", error);
      setLensState({
        profile: null,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch profile",
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (address) {
      await checkLensProfile(address);
    }
  }, [address, checkLensProfile]);

  const clearProfile = useCallback(() => {
    setLensState({
      profile: null,
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    // Lens profile state
    profile: lensState.profile,
    isLoading: lensState.isLoading,
    error: lensState.error,
    
    // Lens profile info object
    lensProfile: lensState.profile
      ? {
          id: lensState.profile.id,
          handle: lensState.profile.handle,
          name: lensState.profile.name,
          bio: lensState.profile.bio,
          picture: lensState.profile.picture?.original?.url,
          ownedBy: lensState.profile.ownedBy,
        }
      : null,

    // Profile methods
    refreshProfile,
    clearProfile,
    
    // Helper properties
    hasLensProfile: !!lensState.profile,
    lensHandle: lensState.profile?.handle || null,
    lensId: lensState.profile?.id || null,
    
    // Connection status
    isConnectedToLens: isConnected && !!lensState.profile,
  };
};