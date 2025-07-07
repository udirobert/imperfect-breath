import { useState, useEffect, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { WalletUser, UserWallet } from "../types/blockchain";

// Blockchain features configuration
const BLOCKCHAIN_FEATURES_ENABLED = false;

export type UserRole = "user" | "creator" | "instructor";

export interface UserProfile {
  id: string;
  role: UserRole;
  creator_verified: boolean;
  wallet_address: string | null;
  // Add other profile fields as needed
}

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If no profile exists, create one
        if (error.code === 'PGRST116') {
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({ id: userId, role: 'user' })
            .select()
            .single();
          if (insertError) throw insertError;
          setProfile(newUser as UserProfile);
        } else {
          throw error;
        }
      } else {
        setProfile(data as UserProfile);
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
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
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

  // Temporarily disabled blockchain features
  const loginWithWallet = useCallback(async () => {
    alert("Wallet features coming soon! ConnectKit integration in progress.");
    throw new Error("Blockchain features not yet available");
  }, []);

  const connectWallet = useCallback(async () => {
    alert("Wallet features coming soon! ConnectKit integration in progress.");
    throw new Error("Blockchain features not yet available");
  }, []);

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        ...profile, // Spread profile details into user object
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
    profile,
    loading,
    loginWithEmail,
    signUpWithEmail,
    logout,
    refreshProfile,

    // Blockchain features (disabled)
    walletUser: null,
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
