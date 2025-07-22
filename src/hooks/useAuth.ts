import { useState, useEffect, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { User, UserRole } from "../types/blockchain";
import { useWalletStatus, useWalletActions } from "./useWallet";

// Blockchain features configuration
const BLOCKCHAIN_FEATURES_ENABLED = true;

// Helper function to get chain name from chainId
const getChainName = (chainId: string | null): string | null => {
  if (!chainId) return null;
  const chainNames: Record<string, string> = {
    '0x1': 'Ethereum',
    '0x89': 'Polygon', 
    '0xa4b1': 'Arbitrum',
  };
  return chainNames[chainId] || 'Unknown';
};

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // New wallet hooks for wallet integration
  const { isConnected, isConnecting, address, chainId } = useWalletStatus();
  const { connect, disconnect } = useWalletActions();
  
  const openConnectModal = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [connect]);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If no profile exists, create one
        if (error.code === "PGRST116") {
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({ id: userId, role: "user" })
            .select()
            .single();
          if (insertError) throw insertError;
          setProfile(newUser as User);
        } else {
          throw error;
        }
      } else {
        setProfile(data as User);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Traditional email/social login
  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      if (session) {
        await supabase.auth.signOut();
      }
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, [session]);

  // Enhanced wallet connection with ConnectKit
  const connectWallet = useCallback(async () => {
    try {
      if (isConnected) {
        console.log("Wallet already connected:", address);
        return;
      }

      // Open ConnectKit modal
      openConnectModal();
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    }
  }, [isConnected, address, openConnectModal]);

  const loginWithWallet = useCallback(async () => {
    try {
      if (!address) {
        await connectWallet();
        return;
      }

      // Create or link wallet to existing profile
      if (session?.user) {
        // Link wallet to existing Supabase user
        const { error } = await supabase
          .from("users")
          .update({
            wallet_address: address,
            preferred_chain: getChainName(chainId) || "ethereum",
          })
          .eq("id", session.user.id);

        if (error) throw error;
        await refreshProfile();
      } else {
        // Create new account with wallet authentication
        // Note: This would typically require a signature verification flow
        console.log("Wallet-only authentication not yet implemented");
        throw new Error(
          "Please sign up with email first, then connect your wallet",
        );
      }
    } catch (error) {
      console.error("Wallet login failed:", error);
      throw error;
    }
  }, [address, session, chainId, openConnectModal, refreshProfile]);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        ...profile, // Spread profile details into user object
        wallet: isConnected
          ? {
              address,
              chain: getChainName(chainId),
              chainId: chainId,
              isConnected,
            }
          : null,
        profile: {
          username: session.user.user_metadata?.username,
          name: session.user.user_metadata?.display_name,
          avatar: session.user.user_metadata?.avatar_url,
        },
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at,
      }
    : null;

  return {
    // Enhanced Supabase auth with wallet support
    session,
    user,
    profile,
    loading,
    loginWithEmail,
    signUpWithEmail,
    logout: useCallback(async () => {
      try {
        if (session) {
          await supabase.auth.signOut();
        }
        if (isConnected) {
          disconnect();
        }
        setSession(null);
        setProfile(null);
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    }, [session, isConnected, disconnect]),
    refreshProfile,

    // Enhanced blockchain features
    walletUser: isConnected ? { address, chainId } : null,
    wallet: isConnected
      ? {
          address,
          chain: getChainName(chainId),
          chainId: chainId,
          isConnected,
        }
      : null,
    walletConnection: {
      isConnected,
      isConnecting,
      chain: getChainName(chainId),
      chainId: chainId,
    },
    loginWithWallet,
    connectWallet: openConnectModal,
    disconnectWallet: disconnect,

    // Helper properties
    isAuthenticated: !!user,
    hasWallet: isConnected && !!address,
    isWeb3User: isConnected && !!address && !!session,

    // Feature flags and chain info
    blockchainEnabled: BLOCKCHAIN_FEATURES_ENABLED,
    supportedChains: [
      "ethereum",
      "polygon",
      "arbitrum",
      "base",
      "lens",
      "story",
    ],
    currentChain: getChainName(chainId),
    currentChainId: chainId,
  };
};
