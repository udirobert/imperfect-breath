import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

// Blockchain features disabled until Tomo SDK is configured
const BLOCKCHAIN_FEATURES_ENABLED = false;

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state (simplified for Supabase only)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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

  // Disabled blockchain features
  const loginWithWallet = useCallback(async () => {
    alert("Wallet features coming soon! Tomo SDK integration in progress.");
    throw new Error("Blockchain features not yet available");
  }, []);

  const connectWallet = useCallback(async () => {
    alert("Wallet features coming soon! Tomo SDK integration in progress.");
    throw new Error("Blockchain features not yet available");
  }, []);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        wallet: null,
        profile: {
          username: session.user.user_metadata?.username,
          displayName: session.user.user_metadata?.display_name,
          avatar: session.user.user_metadata?.avatar_url,
        },
        createdAt: session.user.created_at,
        updatedAt: session.user.updated_at,
      }
    : null;

  return {
    // Legacy Supabase auth (working)
    session,
    user,
    loading,
    loginWithEmail,
    signUpWithEmail,
    logout,

    // Blockchain features (disabled)
    tomoUser: null,
    wallet: null,
    walletConnection: { isConnected: false },
    loginWithWallet,
    connectWallet,

    // Helper properties
    isAuthenticated: !!user,
    hasWallet: false,
    isWeb3User: false,

    // Feature flags
    blockchainEnabled: BLOCKCHAIN_FEATURES_ENABLED,
  };
};
