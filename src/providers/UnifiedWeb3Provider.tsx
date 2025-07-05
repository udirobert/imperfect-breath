import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useFlow } from "../hooks/useFlow";
import { useLens } from "../hooks/useLens";
import { useStory } from "../hooks/useStory";
import { useAccount } from "wagmi";
import { config, debugLog } from "../config/environment";

// Unified chain types
// Full support for all chain types
export type Chain = "flow" | "lens" | "story";

// Unified user interface
export interface UnifiedUser {
  id: string; // Supabase user ID
  preferredChain: Chain | null; // Single active chain
  flowAddress?: string; // USDC payments
  lensProfileId?: string; // Social features
  storyAddress?: string; // IP registration
  email?: string; // User email
  displayName?: string; // Display name
  role: "user" | "creator" | "instructor"; // User role
}

// Unified context interface
interface UnifiedWeb3Context {
  // User state
  user: UnifiedUser | null;
  activeChain: Chain | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Authentication methods
  login: (chain: Chain) => Promise<void>;
  logout: () => Promise<void>;
  switchChain: (newChain: Chain) => Promise<void>;

  // Chain-specific states
  flowConnected: boolean;
  lensConnected: boolean;
  storyConnected: boolean;

  // Utility methods
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const Web3Context = createContext<UnifiedWeb3Context | null>(null);

export const useUnifiedWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useUnifiedWeb3 must be used within UnifiedWeb3Provider");
  }
  return context;
};

export const UnifiedWeb3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // State management
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [activeChain, setActiveChain] = useState<Chain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize blockchain hooks
  const flow = useFlow();
  const lens = useLens();
  const story = useStory();

  // Computed states
  const isAuthenticated = !!user && !!activeChain;
  const flowConnected = flow.user.loggedIn ?? false;
  const lensConnected = lens.isAuthenticated;
  const storyConnected = !!story.client;

  // Initialize user session on mount
  useEffect(() => {
    initializeSession();
    // We intentionally run this only once at mount, so no dependencies are needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wallet address for Story Protocol
  const { address: walletAddress } = useAccount();

  // Monitor blockchain connection changes
  useEffect(() => {
    if (user && activeChain) {
      validateActiveConnection();
    }
  }, [
    flow.user.loggedIn,
    lens.isAuthenticated,
    user,
    activeChain,
    storyConnected,
  ]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get Supabase session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        debugLog("No Supabase session found");
        setUser(null);
        setActiveChain(null);
        return;
      }

      // Fetch user profile from Supabase
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Create new user profile
          const newUser = await createUserProfile(session.user);
          setUser(newUser);
        } else {
          throw profileError;
        }
      } else {
        const unifiedUser: UnifiedUser = {
          id: profile.id,
          preferredChain: profile.preferred_chain as Chain,
          flowAddress: profile.flow_address,
          lensProfileId: profile.lens_profile_id,
          storyAddress: profile.ethereum_address,
          email: session.user.email,
          displayName: profile.display_name,
          role: profile.role || "user",
        };

        setUser(unifiedUser);
        setActiveChain(profile.preferred_chain as Chain);

        debugLog("User session initialized:", unifiedUser);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize session";
      setError(errorMessage);
      console.error("Session initialization error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async (authUser: any): Promise<UnifiedUser> => {
    const { data: newProfile, error } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        email: authUser.email,
        display_name: authUser.user_metadata?.display_name,
        role: "user",
        preferred_chain: null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: newProfile.id,
      preferredChain: null,
      email: authUser.email,
      displayName: newProfile.display_name,
      role: newProfile.role,
    };
  };

  const validateActiveConnection = async () => {
    if (!user || !activeChain) return;

    let isConnected = false;

    switch (activeChain) {
      case "flow":
        isConnected = flowConnected && flow.user.addr === user.flowAddress;
        break;
      case "lens":
        isConnected = lensConnected;
        break;
      case "story":
        isConnected = storyConnected;
        break;
    }

    if (!isConnected) {
      debugLog(
        `Active chain ${activeChain} is not properly connected, clearing session`
      );
      await clearActiveChain();
    }
  };

  const clearActiveChain = async () => {
    if (user) {
      await supabase
        .from("users")
        .update({ preferred_chain: null })
        .eq("id", user.id);

      setUser({ ...user, preferredChain: null });
      setActiveChain(null);
    }
  };

  const login = async (chain: Chain) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error("User must be authenticated with Supabase first");
      }

      // Disconnect from other chains first
      await disconnectAllChains();

      // Connect to the requested chain
      let chainAddress: string | undefined;

      switch (chain) {
        case "flow":
          await flow.logIn();
          if (!flow.user.loggedIn || !flow.user.addr) {
            throw new Error("Flow login failed");
          }
          chainAddress = flow.user.addr;

          // Set up user collection if needed
          const hasCollection = await flow.checkUserCollection(flow.user.addr);
          if (!hasCollection) {
            debugLog("Setting up user collection...");
            await flow.setupUserCollection();
          }
          break;

        case "lens":
          try {
            await lens.authenticate();
            if (!lens.isAuthenticated) {
              throw new Error("Lens authentication failed");
            }
            chainAddress = lens.currentAccount?.address || "";
          } catch (error) {
            throw new Error(
              "Lens authentication failed: " +
                (error instanceof Error ? error.message : "Unknown error")
            );
          }
          break;

        case "story":
          try {
            // Story Protocol client usage - actual implementation
            if (!walletAddress) {
              throw new Error("Wallet not connected");
            }
            chainAddress = walletAddress;
            // Check if Story Protocol client is initialized
            if (!story.client) {
              throw new Error("Story Protocol client not initialized");
            }
          } catch (error) {
            throw new Error(
              "Story Protocol connection failed: " +
                (error instanceof Error ? error.message : "Unknown error")
            );
          }
          break;
      }

      // Update user profile in Supabase
      const updates: any = { preferred_chain: chain };
      if (chain === "flow") updates.flow_address = chainAddress;
      if (chain === "lens")
        updates.lens_profile_id = lens.currentAccount?.address || "";
      if (chain === "story") updates.ethereum_address = chainAddress;

      const { error: updateError } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setUser({ ...user, preferredChain: chain, ...updates });
      setActiveChain(chain);

      debugLog(`Successfully connected to ${chain}:`, chainAddress);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : `Failed to connect to ${chain}`;
      setError(errorMessage);
      console.error(`${chain} login error:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Disconnect from all chains
      await disconnectAllChains();

      // Clear preferred chain in database
      if (user) {
        await supabase
          .from("users")
          .update({ preferred_chain: null })
          .eq("id", user.id);

        setUser({ ...user, preferredChain: null });
      }

      setActiveChain(null);
      debugLog("Successfully logged out from all chains");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchChain = async (newChain: Chain) => {
    if (activeChain === newChain) {
      debugLog(`Already connected to ${newChain}`);
      return;
    }

    await login(newChain);
  };

  const disconnectAllChains = async () => {
    const promises: Promise<void>[] = [];

    if (flowConnected) {
      promises.push(
        flow.logOut().catch((err) => console.warn("Flow logout error:", err))
      );
    }

    if (lensConnected) {
      promises.push(
        lens.logout().catch((err) => console.warn("Lens logout error:", err))
      );
    }

    // Story Protocol doesn't have a formal disconnect method
    // But we should clean up any state to ensure proper disconnect
    if (storyConnected) {
      const storyPromise: Promise<void> = (async () => {
        try {
          // Clear story protocol state
          // The client itself doesn't have a formal disconnect,
          // but clearing user data ensures a clean state
          setUser((prevUser) =>
            prevUser ? { ...prevUser, storyAddress: undefined } : null
          );
          debugLog("Story Protocol state cleared");
        } catch (err) {
          console.warn("Story Protocol disconnect error:", err);
        }
      })();

      promises.push(storyPromise);
    }

    await Promise.all(promises);
  };

  const refreshUser = async () => {
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUser({
          ...user,
          preferredChain: profile.preferred_chain as Chain,
          flowAddress: profile.flow_address,
          lensProfileId: profile.lens_profile_id,
          storyAddress: profile.ethereum_address,
          displayName: profile.display_name,
          role: profile.role,
        });
      }
    }
  };

  const clearError = () => {
    setError(null);
  };

  const contextValue: UnifiedWeb3Context = {
    // User state
    user,
    activeChain,
    isAuthenticated,
    isLoading,
    error,

    // Authentication methods
    login,
    logout,
    switchChain,

    // Chain-specific states
    flowConnected,
    lensConnected,
    storyConnected,

    // Utility methods
    refreshUser,
    clearError,
  };

  return (
    <Web3Context.Provider value={contextValue}>{children}</Web3Context.Provider>
  );
};

// Legacy compatibility exports (to be removed after migration)
export const useWeb3 = useUnifiedWeb3;
export const Web3Provider = UnifiedWeb3Provider;
