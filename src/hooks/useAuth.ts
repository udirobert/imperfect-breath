import { useState, useEffect, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { User, UserRole } from "../types/blockchain";
import { useWalletStatus, useWalletActions } from "./useWallet";
import { revenueCatAuthIntegration } from "../lib/monetization/revenueCatAuthIntegration";
import { useAuthStore } from "../stores/authStore";
import { useSiweAuth } from './useSiweAuth';

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
  
  // Publish to unified AuthSession store
  const setStoreSession = useAuthStore((s) => s.setSession);
  const setStoreLoading = useAuthStore((s) => s.setLoading);
  const setStoreProfile = useAuthStore((s) => s.setProfile);
  const setStoreWallet = useAuthStore((s) => s.setWallet);

  // New wallet hooks for wallet integration
  const { isConnected, isConnecting, address, chainId } = useWalletStatus();
  const { connect, disconnect } = useWalletActions();

  // Sync local hook state into unified store
  useEffect(() => {
    setStoreSession(session);
    setStoreLoading(loading);
  }, [session, loading, setStoreSession, setStoreLoading]);

  useEffect(() => {
    setStoreProfile(profile);
  }, [profile, setStoreProfile]);

  useEffect(() => {
    setStoreWallet(address ?? null, chainId ?? null, !!isConnected);
  }, [address, chainId, isConnected, setStoreWallet]);

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
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      // Initialize RevenueCat auth integration
      await revenueCatAuthIntegration.initialize();
      
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        if (session.user?.id) {
          await fetchProfile(session.user.id);
        }
        // Sync user with RevenueCat
        if (session.user?.id && session.user?.email) {
          await revenueCatAuthIntegration.handleEmailAuth(
            session.user.id,
            session.user.email
          );
        }
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
          if (session.user?.id) {
            await fetchProfile(session.user.id);
          }
          // Sync user with RevenueCat on auth state change
          if (session.user?.id && session.user?.email) {
            await revenueCatAuthIntegration.handleEmailAuth(
              session.user.id,
              session.user.email
            );
          }
        } else {
          setProfile(null);
          // Logout from RevenueCat when user logs out
          await revenueCatAuthIntegration.handleLogout();
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
      // Logout from RevenueCat first
      await revenueCatAuthIntegration.handleLogout();
      
      // Disconnect wallet
      if (isConnected) {
        disconnect();
      }
      
      // Sign out from Supabase
      if (session) {
        await supabase.auth.signOut();
      }
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, [session, isConnected, disconnect]);

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

      // If no Supabase session, perform SIWE verification for wallet-only auth
      if (!session) {
        const { authenticate } = useSiweAuth();
        const result = await authenticate();
        if (!result.success) {
          throw new Error(result.error || 'SIWE authentication failed');
        }
        // Sync wallet with RevenueCat using address as userId (mobile-only integration remains isolated)
        const userId = address;
        await revenueCatAuthIntegration.handleWalletAuth(userId, address, chainId ? parseInt(chainId, 16) : undefined);
        return;
      }

      // Sync wallet with RevenueCat
      const userId = session?.user?.id || address; // Use session user ID if available, otherwise use address
      await revenueCatAuthIntegration.handleWalletAuth(userId, address, chainId ? parseInt(chainId, 16) : undefined);

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
        // Fallback: advise email signup if SIWE path is not applicable
        console.log("Wallet-only authentication now uses SIWE; email signup optional");
      }
    } catch (error) {
      console.error("Wallet login failed:", error);
      throw error;
    }
  }, [address, session, chainId, connectWallet, refreshProfile]);

  const user = session?.user
    ? {
        id: session.user?.id,
        email: session.user?.email || '',
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
          username: session.user?.user_metadata?.username,
          name: session.user?.user_metadata?.display_name,
          avatar: session.user?.user_metadata?.avatar_url,
        },
        createdAt: session.user?.created_at,
        updatedAt: session.user?.updated_at,
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
    logout,
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
