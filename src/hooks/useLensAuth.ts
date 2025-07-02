import { useState, useCallback, useEffect } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { lensClient } from "@/lib/lens/client";
import { getAppAddress } from "@/lib/lens/config";
import { fetchAccountsAvailable } from "@lens-protocol/client/actions";
import { evmAddress } from "@lens-protocol/client";

export interface LensProfile {
  address: string;
  username?: string;
  displayName?: string;
  bio?: string;
  picture?: string;
  coverPicture?: string;
}

export interface LensAuthSession {
  isAuthenticated: boolean;
  sessionType?: string;
  hasProfile?: boolean;
  profile?: LensProfile;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
}

export const useLensAuth = () => {
  const [session, setSession] = useState<LensAuthSession>({
    isAuthenticated: false,
    sessionType: "ANONYMOUS",
    hasProfile: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get connected wallet address
  const { address: walletAddress, isConnected } = useAccount();

  // Wagmi sign message hook
  const { signMessageAsync } = useSignMessage();

  // Fetch profile data for authenticated user
  const fetchProfile = useCallback(async (): Promise<LensProfile | null> => {
    if (!walletAddress) return null;

    try {
      console.log("Fetching profile for wallet:", walletAddress);

      // Use V3 SDK action to fetch available accounts
      const result = await fetchAccountsAvailable(lensClient, {
        managedBy: evmAddress(walletAddress),
        includeOwned: true,
      });

      if (result.isErr()) {
        console.error("Failed to fetch accounts:", result.error);
        return null;
      }

      const accounts = result.value.items;

      if (accounts.length > 0) {
        const account = accounts[0];
        const accountData = account.account;

        return {
          address: accountData.address,
          username:
            accountData.username?.value?.replace("lens/", "") || undefined,
          displayName: accountData.metadata?.name || undefined,
          bio: accountData.metadata?.bio || undefined,
          picture: accountData.metadata?.picture || undefined,
          coverPicture: accountData.metadata?.coverPicture || undefined,
        };
      }

      // No accounts found - user needs to create one
      return null;
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      return null;
    }
  }, [walletAddress]);

  // Resume session on hook initialization
  const resumeSession = useCallback(async () => {
    try {
      const resumed = await lensClient.resumeSession();

      if (resumed.isOk()) {
        // Fetch profile data after resuming session
        const profile = await fetchProfile();

        setSession({
          isAuthenticated: true,
          sessionType: profile ? "AUTHENTICATED" : "ONBOARDING_USER",
          hasProfile: !!profile,
          profile: profile || undefined,
        });
        return true;
      }

      return false;
    } catch (err) {
      console.log("No existing session to resume");
      return false;
    }
  }, [fetchProfile]);

  const login = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      setError("Please connect your wallet first");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting Lens V3 authentication flow...");
      console.log("Wallet address:", walletAddress);
      console.log("App address:", getAppAddress());

      // Step 1: Generate authentication challenge for onboarding user
      const challengeResult = await lensClient.login({
        onboardingUser: {
          app: getAppAddress(),
          wallet: walletAddress,
        },
        signMessage: async (message: string) => {
          console.log("Signing challenge message...");
          return await signMessageAsync({
            account: walletAddress,
            message,
          });
        },
      });

      if (challengeResult.isErr()) {
        throw new Error(
          challengeResult.error.message || "Authentication failed",
        );
      }

      const sessionClient = challengeResult.value;

      // Step 2: Fetch profile data after successful authentication
      const profile = await fetchProfile();

      // Step 3: Update session state
      const newSession: LensAuthSession = {
        isAuthenticated: true,
        sessionType: profile ? "AUTHENTICATED" : "ONBOARDING_USER",
        hasProfile: !!profile,
        profile: profile || undefined,
      };

      setSession(newSession);
      console.log("Lens V3 authentication successful!");

      if (profile) {
        console.log("Profile loaded:", profile);
      } else {
        console.log("No profile found - user may need to create an account");
      }

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown authentication error";
      setError(errorMessage);
      console.error("Lens V3 authentication error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, walletAddress, signMessageAsync, fetchProfile]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // V3 client doesn't have a logout method, we need to clear localStorage
      if (typeof window !== "undefined") {
        // Clear Lens session data from localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("lens.")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      // Reset session state
      setSession({
        isAuthenticated: false,
        sessionType: "ANONYMOUS",
        hasProfile: false,
        profile: undefined,
      });

      console.log("Lens V3 logout successful - cleared local session");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown logout error";
      setError(errorMessage);
      console.error("Lens V3 logout error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current session details
  const getCurrentSession = useCallback(async () => {
    try {
      const resumed = await lensClient.resumeSession();
      if (resumed.isOk()) {
        return { status: "active", client: "available" };
      }
      return null;
    } catch (err) {
      console.log("No current session or not authenticated");
      return null;
    }
  }, []);

  // Auto-resume session on mount if wallet is connected
  useEffect(() => {
    if (isConnected && walletAddress && !session.isAuthenticated) {
      resumeSession();
    }
  }, [isConnected, walletAddress, session.isAuthenticated, resumeSession]);

  return {
    session,
    loading: isLoading,
    error,
    login,
    logout,
    resumeSession,
    getCurrentSession,
    isWalletConnected: isConnected,
    walletAddress,
  };
};
